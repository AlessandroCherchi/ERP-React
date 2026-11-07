import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '../components/layout/AppLayout';
import { Topbar } from '../components/layout/Topbar';
import { KpiValue } from '../components/ui/KpiValue';
import { FornitoreToolbar, type CategoriaFilter, type Filter } from '../components/fornitori/FornitoreToolbar';
import { FornitoreTable, type SortKey } from '../components/fornitori/FornitoreTable';
import { FornitoreDetailPanel } from '../components/fornitori/FornitoreDetailPanel';
import { FornitoreModal } from '../components/fornitori/FornitoreModal';
import { useToast } from '../components/ui/Toast';
import { useConfirm } from '../components/ui/Confirm';
import { useStagger } from '../hooks/useStagger';
import { downloadCsv, formatEuro } from '../lib/format';
import { matchesQuery, paginate, sortRows, type SortDir } from '../lib/tableUtils';
import {
    createFornitore, deleteFornitore, fetchFornitori, updateFornitore,
} from '../lib/mockApi/fornitori';
import { fetchProdotti } from '../lib/mockApi/inventario';
import { labelPagamento, STATO_FORNITORE_LABEL, type Fornitore, type FornitoreFormValues } from '../types/fornitore';
import '../styles/app-shell.css';
import '../styles/fornitori.css';

const PER_PAGE = 10;

/** Valore confrontabile per ciascuna colonna ordinabile. */
function sortValue(f: Fornitore, key: SortKey): string | number {
    return f[key];
}

export function Fornitori() {
    const { toast } = useToast();
    const { confirm } = useConfirm();
    const queryClient = useQueryClient();
    const staggerStyle = useStagger();

    const { data: fornitori = [] } = useQuery({ queryKey: ['fornitori'], queryFn: fetchFornitori });
    // Serve solo per mostrare gli articoli collegati nel pannello dettaglio.
    const { data: prodotti = [] } = useQuery({ queryKey: ['prodotti'], queryFn: fetchProdotti });

    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const [categoria, setCategoria] = useState<CategoriaFilter>('all');
    const [sortKey, setSortKey] = useState<SortKey>('id');
    const [sortDir, setSortDir] = useState<SortDir>('asc');
    const [currentPage, setCurrentPage] = useState(1);

    const [detailId, setDetailId] = useState<number | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['fornitori'] });

    const createMut = useMutation({
        mutationFn: createFornitore,
        onSuccess: (f) => { invalidate(); toast(`Fornitore "${f.nome}" creato con successo.`, 'success'); },
    });
    const updateMut = useMutation({
        mutationFn: ({ id, data }: { id: number; data: FornitoreFormValues }) => updateFornitore(id, data),
        onSuccess: (f) => { invalidate(); toast(`Fornitore "${f.nome}" aggiornato con successo.`, 'success'); },
    });
    const deleteMut = useMutation({
        mutationFn: deleteFornitore,
        onSuccess: (_v, id) => {
            invalidate();
            const nome = fornitori.find((f) => f.id === id)?.nome;
            toast(`Fornitore "${nome}" eliminato.`, 'info');
        },
    });

    const filtered = useMemo(() => {
        let list = fornitori;
        if (filter !== 'all') list = list.filter((f) => f.stato === filter);
        if (categoria !== 'all') list = list.filter((f) => f.categoria === categoria);
        list = list.filter((f) =>
            matchesQuery(f, search, (x) => [x.nome, x.email, x.citta, x.telefono, x.piva, x.categoria])
        );
        return sortRows(list, sortKey, sortDir, sortValue);
    }, [fornitori, filter, categoria, search, sortKey, sortDir]);

    const { page, totalPages, rows: pageRows } = paginate(filtered, currentPage, PER_PAGE);

    function handleSort(key: SortKey) {
        if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        else { setSortKey(key); setSortDir('asc'); }
    }

    function handleFilterChange(f: Filter) { setFilter(f); setCurrentPage(1); }
    function handleCategoriaChange(c: CategoriaFilter) { setCategoria(c); setCurrentPage(1); }
    function handleSearchChange(v: string) { setSearch(v); setCurrentPage(1); }

    function handleExport() {
        const headers = ['ID', 'Ragione Sociale', 'Email', 'Telefono', 'Città', 'Provincia', 'P.IVA', 'Cod.Fiscale', 'PEC', 'SDI', 'Categoria', 'Pagamento', 'Lead time (gg)', 'IBAN', 'Stato', 'Acquistato', 'Ordini', 'Debito'];
        const rows = filtered.map((f) => [
            f.id, f.nome, f.email, f.telefono, f.citta, f.provincia, f.piva, f.cf, f.pec, f.sdi,
            f.categoria, labelPagamento(f.pagamento), f.leadTime, f.iban,
            STATO_FORNITORE_LABEL[f.stato], f.acquistato, f.ordini, f.debito,
        ]);
        downloadCsv(`fornitori_export_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
        toast('Export CSV completato.', 'success');
    }

    function handleDelete(id: number) {
        const f = fornitori.find((x) => x.id === id);
        if (!f) return;
        const collegati = prodotti.filter((p) => p.fornitore === f.nome).length;
        confirm({
            title: 'Conferma Eliminazione',
            text: collegati > 0
                ? `"${f.nome}" è collegato a ${collegati} articoli di magazzino, che resteranno senza fornitore. L'azione è irreversibile.`
                : `Sei sicuro di voler eliminare "${f.nome}"? L'azione è irreversibile.`,
            confirmLabel: 'Elimina',
            icon: 'fa-trash-can',
            onConfirm: () => deleteMut.mutate(id),
        });
    }

    function handleSubmit(values: FornitoreFormValues) {
        if (editingId) updateMut.mutate({ id: editingId, data: values });
        else createMut.mutate(values);
        setModalOpen(false);
    }

    const detailFornitore = detailId != null ? fornitori.find((f) => f.id === detailId) ?? null : null;
    const editingFornitore = editingId != null ? fornitori.find((f) => f.id === editingId) ?? null : null;

    const articoliCollegati = useMemo(
        () => (detailFornitore ? prodotti.filter((p) => p.fornitore === detailFornitore.nome) : []),
        [prodotti, detailFornitore]
    );

    // ---- KPI derivati ----
    const totale = fornitori.length;
    const attivi = fornitori.filter((f) => f.stato === 'attivo').length;
    const debitoTot = fornitori.reduce((s, f) => s + f.debito, 0);
    const leadMedio = totale
        ? Math.round(fornitori.reduce((s, f) => s + f.leadTime, 0) / totale)
        : 0;

    return (
        <AppLayout pageClass="fornitori-page">
            <Topbar>
                <h1>Gestione Fornitori</h1>
                <p>Anagrafica fornitori, condizioni di acquisto ed esposizione</p>
            </Topbar>

            <section className="kpi-grid">
                <div className="kpi-card" style={staggerStyle(0)}>
                    <div className="kpi-icon kpi-icon--clients"><i className="fa-solid fa-truck-field" /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">Totale Fornitori</span>
                        <KpiValue value={String(totale)} />
                        <span className="kpi-trend kpi-trend--up"><i className="fa-solid fa-arrow-trend-up" /> +2.1%</span>
                    </div>
                </div>
                <div className="kpi-card" style={staggerStyle(1)}>
                    <div className="kpi-icon kpi-icon--active"><i className="fa-solid fa-circle-check" /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">Fornitori Attivi</span>
                        <KpiValue value={String(attivi)} />
                        <span className="kpi-trend kpi-trend--up"><i className="fa-solid fa-arrow-trend-up" /> +1.4%</span>
                    </div>
                </div>
                <div className="kpi-card" style={staggerStyle(2)}>
                    <div className="kpi-icon kpi-icon--warning"><i className="fa-solid fa-truck-fast" /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">Lead Time Medio</span>
                        <KpiValue value={`${leadMedio} gg`} />
                        <span className="kpi-trend kpi-trend--down"><i className="fa-solid fa-arrow-trend-down" /> consegna media</span>
                    </div>
                </div>
                <div className="kpi-card" style={staggerStyle(3)}>
                    <div className="kpi-icon kpi-icon--revenue"><i className="fa-solid fa-file-invoice-dollar" /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">Debito Totale</span>
                        <KpiValue value={formatEuro(debitoTot, 0)} />
                        <span className="kpi-trend kpi-trend--down"><i className="fa-solid fa-arrow-trend-down" /> -2.7%</span>
                    </div>
                </div>
            </section>

            <div style={staggerStyle(4)}>
                <FornitoreToolbar
                    search={search}
                    onSearchChange={handleSearchChange}
                    filter={filter}
                    onFilterChange={handleFilterChange}
                    categoria={categoria}
                    onCategoriaChange={handleCategoriaChange}
                    onExport={handleExport}
                    onAdd={() => { setEditingId(null); setModalOpen(true); }}
                />
            </div>

            <div style={staggerStyle(5)}>
                <FornitoreTable
                    rows={pageRows}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                    onView={setDetailId}
                    onEdit={(id) => { setEditingId(id); setModalOpen(true); }}
                    onDelete={handleDelete}
                    total={filtered.length}
                    currentPage={page}
                    totalPages={totalPages}
                    perPage={PER_PAGE}
                    onPageChange={setCurrentPage}
                />
            </div>

            <FornitoreDetailPanel
                fornitore={detailFornitore}
                articoli={articoliCollegati}
                open={detailId != null}
                onClose={() => setDetailId(null)}
                onEdit={() => { const id = detailId; setDetailId(null); setEditingId(id); setModalOpen(true); }}
                onDelete={() => { const id = detailId; setDetailId(null); if (id != null) handleDelete(id); }}
            />

            <FornitoreModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                editing={editingFornitore}
                onSubmit={handleSubmit}
                saving={createMut.isPending || updateMut.isPending}
            />
        </AppLayout>
    );
}
