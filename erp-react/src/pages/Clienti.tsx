import { useMemo, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Topbar } from '../components/layout/Topbar';
import { KpiValue } from '../components/ui/KpiValue';
import { ClientToolbar, type Filter } from '../components/clienti/ClientToolbar';
import { ClientTable, type SortDir, type SortKey } from '../components/clienti/ClientTable';
import { ClientDetailPanel } from '../components/clienti/ClientDetailPanel';
import { ClientModal } from '../components/clienti/ClientModal';
import { useToast } from '../components/ui/Toast';
import { useConfirm } from '../components/ui/Confirm';
import { useStagger } from '../hooks/useStagger';
import { downloadCsv } from '../lib/format';
import { useClienti, useCreateCliente, useDeleteCliente, useUpdateCliente } from '../data';
import { usePermissions } from '../auth/hooks';
import { useConfig } from '../config/configStore';
import type { ClienteFormValues } from '../types/cliente';
import '../styles/app-shell.css';
import '../styles/clienti.css';

export function Clienti() {
    const { toast } = useToast();
    const { confirm } = useConfirm();
    const staggerStyle = useStagger();
    const perm = usePermissions('anagrafiche');
    const PER_PAGE = useConfig().pageSize;

    const { data: clienti = [] } = useClienti();

    // ---- stato UI effimero (filtri/ricerca/ordinamento/paginazione) ----
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const [sortKey, setSortKey] = useState<SortKey>('id');
    const [sortDir, setSortDir] = useState<SortDir>('asc');
    const [currentPage, setCurrentPage] = useState(1);

    const [detailId, setDetailId] = useState<number | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const createMut = useCreateCliente({
        onSuccess: (c) => toast(`Cliente "${c.nome}" creato con successo.`, 'success'),
    });
    const updateMut = useUpdateCliente({
        onSuccess: (c) => toast(`Cliente "${c.nome}" aggiornato con successo.`, 'success'),
    });
    const deleteMut = useDeleteCliente({
        onSuccess: (_v, id) => {
            const nome = clienti.find((c) => c.id === id)?.nome;
            toast(`Cliente "${nome}" eliminato.`, 'info');
        },
    });

    // ---- filtro + ricerca + sort — porting 1:1 di getFilteredClients() ----
    const filtered = useMemo(() => {
        let list = clienti.slice();

        if (filter !== 'all') list = list.filter((c) => c.stato === filter);

        if (search) {
            const q = search.toLowerCase();
            list = list.filter(
                (c) =>
                    c.nome.toLowerCase().includes(q) ||
                    c.email.toLowerCase().includes(q) ||
                    c.citta.toLowerCase().includes(q) ||
                    c.telefono.includes(q) ||
                    (c.piva && c.piva.toLowerCase().includes(q))
            );
        }

        list.sort((a, b) => {
            const valA = a[sortKey];
            const valB = b[sortKey];
            const na = typeof valA === 'string' ? valA.toLowerCase() : valA;
            const nb = typeof valB === 'string' ? valB.toLowerCase() : valB;
            if (na < nb) return sortDir === 'asc' ? -1 : 1;
            if (na > nb) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return list;
    }, [clienti, filter, search, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const page = Math.min(currentPage, totalPages);
    const pageRows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    function handleSort(key: SortKey) {
        if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        else { setSortKey(key); setSortDir('asc'); }
    }

    function handleFilterChange(f: Filter) { setFilter(f); setCurrentPage(1); }
    function handleSearchChange(v: string) { setSearch(v); setCurrentPage(1); }

    function handleExport() {
        const headers = ['ID', 'Ragione Sociale', 'Email', 'Telefono', 'Città', 'Provincia', 'P.IVA', 'Cod.Fiscale', 'PEC', 'SDI', 'Stato', 'Fatturato', 'Ordini', 'Credito'];
        const rows = filtered.map((c) => [c.id, c.nome, c.email, c.telefono, c.citta, c.provincia, c.piva, c.cf, c.pec, c.sdi, c.stato, c.fatturato, c.ordini, c.credito]);
        downloadCsv(`clienti_export_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
        toast('Export CSV completato.', 'success');
    }

    function handleDelete(id: number) {
        const c = clienti.find((x) => x.id === id);
        if (!c) return;
        confirm({
            title: 'Conferma Eliminazione',
            text: `Sei sicuro di voler eliminare "${c.nome}"? L'azione è irreversibile.`,
            confirmLabel: 'Elimina',
            icon: 'fa-trash-can',
            onConfirm: () => deleteMut.mutate(id),
        });
    }

    function handleSubmit(values: ClienteFormValues) {
        if (editingId) updateMut.mutate({ id: editingId, data: values });
        else createMut.mutate(values);
        setModalOpen(false);
    }

    const detailCliente = detailId != null ? clienti.find((c) => c.id === detailId) ?? null : null;
    const editingCliente = editingId != null ? clienti.find((c) => c.id === editingId) ?? null : null;

    // ---- KPI derivati — porting 1:1 di updateKpi() ----
    const totale = clienti.length;
    const attivi = clienti.filter((c) => c.stato === 'attivo').length;
    const creditoTot = clienti.reduce((s, c) => s + (c.credito || 0), 0);

    return (
        <AppLayout pageClass="clienti-page">
            <Topbar>
                <h1>Gestione Clienti</h1>
                <p>Anagrafica completa e storico ordini</p>
            </Topbar>

            <section className="kpi-grid">
                <div className="kpi-card" style={staggerStyle(0)}>
                    <div className="kpi-icon kpi-icon--clients"><i className="fa-solid fa-users" /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">Totale Clienti</span>
                        <KpiValue value={String(totale)} />
                        <span className="kpi-trend kpi-trend--up"><i className="fa-solid fa-arrow-trend-up" /> +8.1%</span>
                    </div>
                </div>
                <div className="kpi-card" style={staggerStyle(1)}>
                    <div className="kpi-icon kpi-icon--active"><i className="fa-solid fa-circle-check" /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">Clienti Attivi</span>
                        <KpiValue value={String(attivi)} />
                        <span className="kpi-trend kpi-trend--up"><i className="fa-solid fa-arrow-trend-up" /> +4.3%</span>
                    </div>
                </div>
                <div className="kpi-card" style={staggerStyle(2)}>
                    <div className="kpi-icon kpi-icon--new"><i className="fa-solid fa-user-plus" /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">Nuovi (Mese)</span>
                        <KpiValue value="16" />
                        <span className="kpi-trend kpi-trend--up"><i className="fa-solid fa-arrow-trend-up" /> +12.5%</span>
                    </div>
                </div>
                <div className="kpi-card" style={staggerStyle(3)}>
                    <div className="kpi-icon kpi-icon--revenue"><i className="fa-solid fa-coins" /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">Credito Totale</span>
                        <KpiValue value={`€ ${creditoTot.toLocaleString('it-IT')}`} />
                        <span className="kpi-trend kpi-trend--down"><i className="fa-solid fa-arrow-trend-down" /> -3.1%</span>
                    </div>
                </div>
            </section>

            <div style={staggerStyle(4)}>
                <ClientToolbar
                    search={search}
                    onSearchChange={handleSearchChange}
                    filter={filter}
                    onFilterChange={handleFilterChange}
                    onExport={handleExport}
                    onAdd={perm.create ? () => { setEditingId(null); setModalOpen(true); } : undefined}
                />
            </div>

            <div style={staggerStyle(5)}>
                <ClientTable
                    rows={pageRows}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                    onView={setDetailId}
                    onEdit={perm.update ? (id) => { setEditingId(id); setModalOpen(true); } : undefined}
                    onDelete={perm.delete ? handleDelete : undefined}
                    total={filtered.length}
                    currentPage={page}
                    totalPages={totalPages}
                    perPage={PER_PAGE}
                    onPageChange={setCurrentPage}
                />
            </div>

            <ClientDetailPanel
                cliente={detailCliente}
                open={detailId != null}
                onClose={() => setDetailId(null)}
                onEdit={perm.update ? () => { const id = detailId; setDetailId(null); setEditingId(id); setModalOpen(true); } : undefined}
                onDelete={perm.delete ? () => { const id = detailId; setDetailId(null); if (id != null) handleDelete(id); } : undefined}
            />

            <ClientModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                editing={editingCliente}
                onSubmit={handleSubmit}
                saving={createMut.isPending || updateMut.isPending}
            />
        </AppLayout>
    );
}
