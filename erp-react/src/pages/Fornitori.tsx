import { useMemo } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Topbar } from '../components/layout/Topbar';
import { DataTable, EntityCell, KpiGrid, ListToolbar, ToolbarSelect, type Column, type RowAction } from '../components/data';
import { FornitoreDetailPanel } from '../components/fornitori/FornitoreDetailPanel';
import { FornitoreModal } from '../components/fornitori/FornitoreModal';
import type { PanelAction } from '../components/ui/DetailPanelShell';
import { useToast } from '../components/ui/Toast';
import { useConfirm } from '../components/ui/Confirm';
import { useStagger } from '../hooks/useStagger';
import { useListState } from '../hooks/useListState';
import { useCrudDialogs } from '../hooks/useCrudDialogs';
import { useCreateFornitore, useDeleteFornitore, useFornitori, useProdotti, useUpdateFornitore } from '../data';
import { usePermissions } from '../auth/hooks';
import { useConfig } from '../config/configStore';
import { formatEuro, formatNumber } from '../lib/format';
import { exportCsv } from '../lib/csv';
import { byKey, queryRows } from '../lib/listQuery';
import { initials } from '../lib/text';
import {
    labelPagamento, STATO_FORNITORE_LABEL, type Fornitore, type FornitoreFormValues, type FornitoreStato,
} from '../types/fornitore';
import '../styles/app-shell.css';
import '../styles/fornitori.css';

type SortKey = 'id' | 'nome' | 'categoria' | 'citta' | 'leadTime' | 'acquistato' | 'debito';
type StatoFilter = 'all' | FornitoreStato;

const STATO_CHIPS: { value: StatoFilter; label: string }[] = [
    { value: 'all', label: 'Tutti' },
    { value: 'attivo', label: 'Attivi' },
    { value: 'sospeso', label: 'Sospesi' },
    { value: 'inattivo', label: 'Inattivi' },
];

export function Fornitori() {
    const { toast } = useToast();
    const { confirm } = useConfirm();
    const stagger = useStagger();
    const perm = usePermissions('anagrafiche');
    const { pageSize, tables } = useConfig();

    const { data: fornitori = [] } = useFornitori();
    // Serve per gli articoli collegati (dettaglio) e l'avviso in eliminazione.
    const { data: prodotti = [] } = useProdotti();

    const list = useListState<SortKey, { stato: StatoFilter; categoria: string }>({
        sort: { key: 'id', dir: 'asc' },
        filters: { stato: 'all', categoria: 'all' },
    });
    const dlg = useCrudDialogs(fornitori);

    const createMut = useCreateFornitore({ onSuccess: (f) => toast(`Fornitore "${f.nome}" creato con successo.`, 'success') });
    const updateMut = useUpdateFornitore({ onSuccess: (f) => toast(`Fornitore "${f.nome}" aggiornato con successo.`, 'success') });
    const deleteMut = useDeleteFornitore({ onSuccess: () => toast('Fornitore eliminato.', 'info') });

    const { stato, categoria } = list.filters;
    const result = useMemo(() => queryRows(fornitori, {
        filters: [
            ...(stato === 'all' ? [] : [(f: Fornitore) => f.stato === stato]),
            ...(categoria === 'all' ? [] : [(f: Fornitore) => f.categoria === categoria]),
        ],
        search: list.search,
        searchFields: (f) => [f.nome, f.email, f.citta, f.telefono, f.piva, f.categoria],
        sort: { key: list.sortKey, dir: list.sortDir, value: byKey },
        page: { current: list.page, size: pageSize },
    }), [fornitori, stato, categoria, list.search, list.sortKey, list.sortDir, list.page, pageSize]);

    /** Articoli che hanno questo fornitore come abituale (relazione per id). */
    const articoliDi = (id: number) => prodotti.filter((p) => p.fornitoreId === id);

    function handleDelete(f: Fornitore) {
        const collegati = articoliDi(f.id).length;
        confirm({
            title: 'Conferma Eliminazione',
            text: collegati > 0
                ? `"${f.nome}" è collegato a ${collegati} articoli di magazzino, che resteranno senza fornitore. L'azione è irreversibile.`
                : `Sei sicuro di voler eliminare "${f.nome}"? L'azione è irreversibile.`,
            confirmLabel: 'Elimina',
            icon: 'fa-trash-can',
            onConfirm: () => deleteMut.mutate(f.id),
        });
    }

    function handleSubmit(values: FornitoreFormValues) {
        if (dlg.editingId != null) updateMut.mutate({ id: dlg.editingId, data: values });
        else createMut.mutate(values);
        dlg.closeModal();
    }

    function handleExport() {
        exportCsv('fornitori', result.filtered, [
            { header: 'ID', value: (f) => f.id },
            { header: 'Ragione Sociale', value: (f) => f.nome },
            { header: 'Email', value: (f) => f.email },
            { header: 'Telefono', value: (f) => f.telefono },
            { header: 'Città', value: (f) => f.citta },
            { header: 'Provincia', value: (f) => f.provincia },
            { header: 'P.IVA', value: (f) => f.piva },
            { header: 'Cod.Fiscale', value: (f) => f.cf },
            { header: 'PEC', value: (f) => f.pec },
            { header: 'SDI', value: (f) => f.sdi },
            { header: 'Categoria', value: (f) => f.categoria },
            { header: 'Pagamento', value: (f) => labelPagamento(f.pagamento) },
            { header: 'Lead time (gg)', value: (f) => f.leadTime },
            { header: 'IBAN', value: (f) => f.iban },
            { header: 'Stato', value: (f) => STATO_FORNITORE_LABEL[f.stato] },
            { header: 'Acquistato', value: (f) => f.acquistato },
            { header: 'Ordini', value: (f) => f.ordini },
            { header: 'Debito', value: (f) => f.debito },
        ]);
        toast('Export CSV completato.', 'success');
    }

    const columns: Column<Fornitore, SortKey>[] = [
        { id: 'id', header: '#', sortKey: 'id', cell: (f) => f.id },
        { id: 'nome', header: 'Fornitore', sortKey: 'nome', cell: (f) => <EntityCell icon={initials(f.nome)} label={f.nome} onOpen={() => dlg.openDetail(f.id)} /> },
        { id: 'categoria', header: 'Categoria', sortKey: 'categoria', cell: (f) => f.categoria },
        { id: 'citta', header: 'Città', sortKey: 'citta', cell: (f) => f.citta || '—' },
        { id: 'lead', header: 'Lead time', sortKey: 'leadTime', cell: (f) => `${f.leadTime} gg` },
        { id: 'pagamento', header: 'Pagamento', cell: (f) => labelPagamento(f.pagamento) },
        { id: 'acquistato', header: 'Acquistato', sortKey: 'acquistato', className: 'cell-strong', cell: (f) => formatEuro(f.acquistato, 0) },
        { id: 'debito', header: 'Debito', sortKey: 'debito', className: 'cell-strong', cell: (f) => formatEuro(f.debito, 0) },
        { id: 'stato', header: 'Stato', cell: (f) => <span className={`status-badge status-badge--${f.stato}`}>{STATO_FORNITORE_LABEL[f.stato]}</span> },
    ];

    const rowActions: RowAction<Fornitore>[] = [
        { id: 'view', icon: 'fa-eye', label: 'Dettaglio', onClick: (f) => dlg.openDetail(f.id) },
        ...(perm.update ? [{ id: 'edit', icon: 'fa-pen', label: 'Modifica', onClick: (f: Fornitore) => dlg.openEdit(f.id) }] : []),
        ...(perm.delete ? [{ id: 'delete', icon: 'fa-trash-can', label: 'Elimina', onClick: handleDelete }] : []),
    ];

    const detail = dlg.detail;
    const panelActions: PanelAction[] = detail ? [
        ...(perm.update ? [{ id: 'edit', label: 'Modifica', icon: 'fa-pen', variant: 'outline' as const, onClick: () => dlg.openEdit(detail.id) }] : []),
        ...(perm.delete ? [{ id: 'delete', label: 'Elimina', icon: 'fa-trash-can', variant: 'danger' as const, onClick: () => { dlg.closeDetail(); handleDelete(detail); } }] : []),
    ] : [];

    const attivi = fornitori.filter((f) => f.stato === 'attivo').length;
    const debitoTot = fornitori.reduce((s, f) => s + f.debito, 0);
    const leadMedio = fornitori.length ? Math.round(fornitori.reduce((s, f) => s + f.leadTime, 0) / fornitori.length) : 0;

    return (
        <AppLayout pageClass="fornitori-page">
            <Topbar>
                <h1>Gestione Fornitori</h1>
                <p>Anagrafica fornitori, condizioni di acquisto ed esposizione</p>
            </Topbar>

            <KpiGrid stagger={stagger} items={[
                { icon: 'fa-truck-field', variant: 'clients', label: 'Totale Fornitori', value: formatNumber(fornitori.length) },
                { icon: 'fa-circle-check', variant: 'active', label: 'Fornitori Attivi', value: formatNumber(attivi) },
                { icon: 'fa-truck-fast', variant: 'warning', label: 'Lead Time Medio', value: `${leadMedio} gg`, trend: { dir: 'down', text: 'consegna media' } },
                { icon: 'fa-file-invoice-dollar', variant: 'revenue', label: 'Debito Totale', value: formatEuro(debitoTot, 0), trend: { dir: 'down', text: 'da pagare' } },
            ]} />

            <div style={stagger(4)}>
                <ListToolbar
                    search={list.search}
                    onSearchChange={list.setSearch}
                    searchPlaceholder="Cerca fornitore per nome, città o P.IVA..."
                    chips={{ label: 'Filtra per stato', value: stato, options: STATO_CHIPS, onChange: (v) => list.setFilter('stato', v) }}
                    onExport={perm.export ? handleExport : undefined}
                    onAdd={perm.create ? dlg.openCreate : undefined}
                    addLabel="Nuovo Fornitore"
                >
                    <ToolbarSelect
                        label="Filtra per categoria fornita"
                        value={categoria}
                        onChange={(v) => list.setFilter('categoria', v)}
                        options={[{ value: 'all', label: 'Tutte le categorie' }, ...tables.categorie]}
                    />
                </ListToolbar>
            </div>

            <div style={stagger(5)}>
                <DataTable
                    rows={result.rows}
                    columns={columns}
                    sortKey={list.sortKey}
                    sortDir={list.sortDir}
                    onSort={list.toggleSort}
                    actions={rowActions}
                    rowLabel={(f) => f.nome}
                    rowClassName={(f) => (f.stato === 'sospeso' ? 'row--alert' : undefined)}
                    empty={{ icon: 'fa-truck-field', text: 'Nessun fornitore trovato.' }}
                    pagination={{ total: result.filtered.length, page: result.page, totalPages: result.totalPages, pageSize, onPageChange: list.setPage }}
                />
            </div>

            <FornitoreDetailPanel
                fornitore={detail}
                articoli={detail ? articoliDi(detail.id) : []}
                open={dlg.detailOpen}
                onClose={dlg.closeDetail}
                actions={panelActions}
            />

            <FornitoreModal
                open={dlg.modalOpen}
                onClose={dlg.closeModal}
                editing={dlg.editing}
                onSubmit={handleSubmit}
                saving={createMut.isPending || updateMut.isPending}
            />
        </AppLayout>
    );
}
