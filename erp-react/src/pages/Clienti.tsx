import { useMemo } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Topbar } from '../components/layout/Topbar';
import { DataTable, EntityCell, KpiGrid, ListToolbar, type Column, type RowAction } from '../components/data';
import { ClientDetailPanel } from '../components/clienti/ClientDetailPanel';
import { ClientModal } from '../components/clienti/ClientModal';
import type { PanelAction } from '../components/ui/DetailPanelShell';
import { useToast } from '../components/ui/toastContext';
import { useStagger } from '../hooks/useStagger';
import { useListState } from '../hooks/useListState';
import { useCrudDialogs } from '../hooks/useCrudDialogs';
import { useDeleteConfirm } from '../hooks/useDeleteConfirm';
import { useClienti, useCreateCliente, useDeleteCliente, useUpdateCliente } from '../data';
import { usePermissions } from '../auth/hooks';
import { useConfig } from '../config/configStore';
import { formatEuro, formatNumber } from '../lib/format';
import { exportCsv } from '../lib/csv';
import { byKey, queryRows } from '../lib/listQuery';
import { initials } from '../lib/text';
import { STATO_CLIENTE_LABEL, type Cliente, type ClienteFormValues, type ClienteStato } from '../types/cliente';
import '../styles/app-shell.css';
import '../styles/clienti.css';

type SortKey = 'id' | 'nome' | 'email' | 'citta' | 'fatturato' | 'stato';
type StatoFilter = 'all' | ClienteStato;

const STATO_CHIPS: { value: StatoFilter; label: string }[] = [
    { value: 'all', label: 'Tutti' },
    { value: 'attivo', label: 'Attivi' },
    { value: 'inattivo', label: 'Inattivi' },
    { value: 'prospect', label: 'Prospect' },
];

export function Clienti() {
    const { toast } = useToast();
    const stagger = useStagger();
    const confirmDelete = useDeleteConfirm();
    const perm = usePermissions('anagrafiche');
    const { pageSize } = useConfig();

    const { data: clienti = [] } = useClienti();
    const list = useListState<SortKey, { stato: StatoFilter }>({ sort: { key: 'id', dir: 'asc' }, filters: { stato: 'all' } });
    const dlg = useCrudDialogs(clienti);

    const createMut = useCreateCliente({ onSuccess: (c) => toast(`Cliente "${c.nome}" creato con successo.`, 'success') });
    const updateMut = useUpdateCliente({ onSuccess: (c) => toast(`Cliente "${c.nome}" aggiornato con successo.`, 'success') });
    const deleteMut = useDeleteCliente({ onSuccess: () => toast('Cliente eliminato.', 'info') });

    const result = useMemo(() => queryRows(clienti, {
        filters: list.filters.stato === 'all' ? [] : [(c) => c.stato === list.filters.stato],
        search: list.search,
        searchFields: (c) => [c.nome, c.email, c.citta, c.telefono, c.piva],
        sort: { key: list.sortKey, dir: list.sortDir, value: byKey },
        page: { current: list.page, size: pageSize },
    }), [clienti, list.filters.stato, list.search, list.sortKey, list.sortDir, list.page, pageSize]);

    function handleDelete(c: Cliente) {
        confirmDelete(`"${c.nome}"`, () => deleteMut.mutate(c.id));
    }

    function handleSubmit(values: ClienteFormValues) {
        if (dlg.editingId != null) updateMut.mutate({ id: dlg.editingId, data: values });
        else createMut.mutate(values);
        dlg.closeModal();
    }

    function handleExport() {
        exportCsv('clienti', result.filtered, [
            { header: 'ID', value: (c) => c.id },
            { header: 'Ragione Sociale', value: (c) => c.nome },
            { header: 'Email', value: (c) => c.email },
            { header: 'Telefono', value: (c) => c.telefono },
            { header: 'Città', value: (c) => c.citta },
            { header: 'Provincia', value: (c) => c.provincia },
            { header: 'P.IVA', value: (c) => c.piva },
            { header: 'Cod.Fiscale', value: (c) => c.cf },
            { header: 'PEC', value: (c) => c.pec },
            { header: 'SDI', value: (c) => c.sdi },
            { header: 'Stato', value: (c) => STATO_CLIENTE_LABEL[c.stato] },
            { header: 'Fatturato', value: (c) => c.fatturato },
            { header: 'Ordini', value: (c) => c.ordini },
            { header: 'Credito', value: (c) => c.credito },
        ]);
        toast('Export CSV completato.', 'success');
    }

    const columns: Column<Cliente, SortKey>[] = [
        { id: 'id', header: '#', sortKey: 'id', cell: (c) => c.id },
        { id: 'nome', header: 'Cliente', sortKey: 'nome', cell: (c) => <EntityCell icon={initials(c.nome)} label={c.nome} onOpen={() => dlg.openDetail(c.id)} /> },
        { id: 'email', header: 'Email', sortKey: 'email', cell: (c) => c.email },
        { id: 'telefono', header: 'Telefono', cell: (c) => c.telefono },
        { id: 'citta', header: 'Città', sortKey: 'citta', cell: (c) => c.citta },
        { id: 'fatturato', header: 'Fatturato', sortKey: 'fatturato', className: 'cell-strong', cell: (c) => formatEuro(c.fatturato, 0) },
        { id: 'stato', header: 'Stato', sortKey: 'stato', cell: (c) => <span className={`status-badge status-badge--${c.stato}`}>{STATO_CLIENTE_LABEL[c.stato]}</span> },
    ];

    const rowActions: RowAction<Cliente>[] = [
        { id: 'view', icon: 'fa-eye', label: 'Dettaglio', onClick: (c) => dlg.openDetail(c.id) },
        ...(perm.update ? [{ id: 'edit', icon: 'fa-pen', label: 'Modifica', onClick: (c: Cliente) => dlg.openEdit(c.id) }] : []),
        ...(perm.delete ? [{ id: 'delete', icon: 'fa-trash-can', label: 'Elimina', onClick: handleDelete }] : []),
    ];

    const detail = dlg.detail;
    const panelActions: PanelAction[] = detail ? [
        ...(perm.update ? [{ id: 'edit', label: 'Modifica', icon: 'fa-pen', variant: 'outline' as const, onClick: () => dlg.openEdit(detail.id) }] : []),
        ...(perm.delete ? [{ id: 'delete', label: 'Elimina', icon: 'fa-trash-can', variant: 'danger' as const, onClick: () => { dlg.closeDetail(); handleDelete(detail); } }] : []),
    ] : [];

    // KPI derivati dall'anagrafica corrente
    const attivi = clienti.filter((c) => c.stato === 'attivo').length;
    const prospect = clienti.filter((c) => c.stato === 'prospect').length;
    const creditoTot = clienti.reduce((s, c) => s + c.credito, 0);

    return (
        <AppLayout pageClass="clienti-page">
            <Topbar>
                <h1>Gestione Clienti</h1>
                <p>Anagrafica completa e storico ordini</p>
            </Topbar>

            <KpiGrid stagger={stagger} items={[
                { icon: 'fa-users', variant: 'clients', label: 'Totale Clienti', value: formatNumber(clienti.length) },
                { icon: 'fa-circle-check', variant: 'active', label: 'Clienti Attivi', value: formatNumber(attivi), trend: { dir: 'up', text: `${clienti.length ? Math.round((attivi / clienti.length) * 100) : 0}% del totale` } },
                { icon: 'fa-user-plus', variant: 'new', label: 'Prospect', value: formatNumber(prospect), trend: { dir: 'up', text: 'da convertire' } },
                { icon: 'fa-coins', variant: 'revenue', label: 'Credito Totale', value: formatEuro(creditoTot, 0), trend: { dir: 'down', text: 'da incassare' } },
            ]} />

            <div style={stagger(4)}>
                <ListToolbar
                    search={list.search}
                    onSearchChange={list.setSearch}
                    searchPlaceholder="Cerca cliente per nome, email, città o P.IVA..."
                    chips={{ label: 'Filtra per stato', value: list.filters.stato, options: STATO_CHIPS, onChange: (v) => list.setFilter('stato', v) }}
                    onExport={perm.export ? handleExport : undefined}
                    onAdd={perm.create ? dlg.openCreate : undefined}
                    addLabel="Nuovo Cliente"
                />
            </div>

            <div style={stagger(5)}>
                <DataTable
                    rows={result.rows}
                    columns={columns}
                    sortKey={list.sortKey}
                    sortDir={list.sortDir}
                    onSort={list.toggleSort}
                    actions={rowActions}
                    rowLabel={(c) => c.nome}
                    empty={{ icon: 'fa-users-slash', text: 'Nessun cliente trovato.' }}
                    pagination={{ total: result.filtered.length, page: result.page, totalPages: result.totalPages, pageSize, onPageChange: list.setPage }}
                />
            </div>

            <ClientDetailPanel cliente={detail} open={dlg.detailOpen} onClose={dlg.closeDetail} actions={panelActions} />

            <ClientModal
                open={dlg.modalOpen}
                onClose={dlg.closeModal}
                editing={dlg.editing}
                onSubmit={handleSubmit}
                saving={createMut.isPending || updateMut.isPending}
            />
        </AppLayout>
    );
}
