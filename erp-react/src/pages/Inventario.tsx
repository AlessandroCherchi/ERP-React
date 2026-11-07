import { useMemo, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Topbar } from '../components/layout/Topbar';
import { KpiValue } from '../components/ui/KpiValue';
import { ProductToolbar, type CategoriaFilter, type Filter } from '../components/inventario/ProductToolbar';
import { ProductTable, type SortDir, type SortKey } from '../components/inventario/ProductTable';
import { ProductDetailPanel } from '../components/inventario/ProductDetailPanel';
import { ProdottoModal } from '../components/inventario/ProdottoModal';
import { MovimentoModal } from '../components/inventario/MovimentoModal';
import { useToast } from '../components/ui/Toast';
import { useConfirm } from '../components/ui/Confirm';
import { useStagger } from '../hooks/useStagger';
import { downloadCsv, formatEuro, parseNum } from '../lib/format';
import {
    useCreateProdotto, useDeleteProdotto, useFornitoriNomi, useMovimenti, useProdotti,
    useRegistraMovimento, useUpdateProdotto,
} from '../data';
import { usePermissions } from '../auth/hooks';
import { useConfig } from '../config/configStore';
import { nextNumber } from '../config/numbering';
import {
    statoProdotto, STATO_LABEL, valoreGiacenza,
    type MovimentoFormValues, type Prodotto,
} from '../types/prodotto';
import type { ProdottoForm } from '../types/quickActions';
import '../styles/app-shell.css';
import '../styles/inventario.css';

/** Chiavi di ordinamento che non sono campi diretti di Prodotto. */
function sortValue(p: Prodotto, key: SortKey): string | number {
    if (key === 'valore') return valoreGiacenza(p);
    return p[key];
}

export function Inventario() {
    const { toast } = useToast();
    const { confirm } = useConfirm();
    const staggerStyle = useStagger();
    const perm = usePermissions('magazzino');
    const config = useConfig();
    const PER_PAGE = config.pageSize;

    const { data: prodotti = [] } = useProdotti();
    const { data: movimenti = [] } = useMovimenti();
    const { data: fornitoriNomi = [] } = useFornitoriNomi();

    // ---- stato UI effimero (filtri/ricerca/ordinamento/paginazione) ----
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const [categoria, setCategoria] = useState<CategoriaFilter>('all');
    const [sortKey, setSortKey] = useState<SortKey>('sku');
    const [sortDir, setSortDir] = useState<SortDir>('asc');
    const [currentPage, setCurrentPage] = useState(1);

    const [detailId, setDetailId] = useState<number | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [movimentoId, setMovimentoId] = useState<number | null>(null);

    // Le mutation di magazzino invalidano da sé giacenze e movimenti (data/hooks.ts).
    const createMut = useCreateProdotto({
        onSuccess: (p) => toast(`Prodotto "${p.nome}" creato con successo.`, 'success'),
    });
    const updateMut = useUpdateProdotto({
        onSuccess: (p) => toast(`Prodotto "${p.nome}" aggiornato con successo.`, 'success'),
    });
    const deleteMut = useDeleteProdotto({
        onSuccess: (_v, id) => {
            const nome = prodotti.find((p) => p.id === id)?.nome;
            toast(`Prodotto "${nome}" eliminato.`, 'info');
        },
    });
    const movimentoMut = useRegistraMovimento({
        onSuccess: (p) => {
            toast(`Giacenza di "${p.nome}" aggiornata: ${p.giacenza.toLocaleString('it-IT')} ${p.unita}.`, 'success');
        },
    });

    // ---- filtro + ricerca + ordinamento ----
    const filtered = useMemo(() => {
        let list = prodotti.slice();

        if (filter !== 'all') list = list.filter((p) => statoProdotto(p) === filter);
        if (categoria !== 'all') list = list.filter((p) => p.categoria === categoria);

        if (search) {
            const q = search.toLowerCase();
            list = list.filter(
                (p) =>
                    p.nome.toLowerCase().includes(q) ||
                    p.sku.toLowerCase().includes(q) ||
                    p.fornitore.toLowerCase().includes(q) ||
                    p.categoria.toLowerCase().includes(q) ||
                    p.ubicazione.toLowerCase().includes(q)
            );
        }

        list.sort((a, b) => {
            const valA = sortValue(a, sortKey);
            const valB = sortValue(b, sortKey);
            const na = typeof valA === 'string' ? valA.toLowerCase() : valA;
            const nb = typeof valB === 'string' ? valB.toLowerCase() : valB;
            if (na < nb) return sortDir === 'asc' ? -1 : 1;
            if (na > nb) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return list;
    }, [prodotti, filter, categoria, search, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const page = Math.min(currentPage, totalPages);
    const pageRows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    function handleSort(key: SortKey) {
        if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        else { setSortKey(key); setSortDir('asc'); }
    }

    function handleFilterChange(f: Filter) { setFilter(f); setCurrentPage(1); }
    function handleCategoriaChange(c: CategoriaFilter) { setCategoria(c); setCurrentPage(1); }
    function handleSearchChange(v: string) { setSearch(v); setCurrentPage(1); }

    function handleExport() {
        const headers = ['SKU', 'Prodotto', 'Categoria', 'Fornitore', 'Giacenza', 'Unità', 'Scorta minima', 'Costo', 'Prezzo', 'Valore magazzino', 'IVA %', 'Ubicazione', 'Stato'];
        const rows = filtered.map((p) => [
            p.sku, p.nome, p.categoria, p.fornitore, p.giacenza, p.unita, p.scorta,
            p.costo, p.prezzo, valoreGiacenza(p), p.iva, p.ubicazione, STATO_LABEL[statoProdotto(p)],
        ]);
        downloadCsv(`inventario_export_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
        toast('Export CSV completato.', 'success');
    }

    function handleDelete(id: number) {
        const p = prodotti.find((x) => x.id === id);
        if (!p) return;
        confirm({
            title: 'Conferma Eliminazione',
            text: `Sei sicuro di voler eliminare "${p.nome}" (${p.sku})? L'azione è irreversibile e rimuove anche lo storico movimenti.`,
            confirmLabel: 'Elimina',
            icon: 'fa-trash-can',
            onConfirm: () => deleteMut.mutate(id),
        });
    }

    function handleSubmit(values: ProdottoForm) {
        if (editingId) updateMut.mutate({ id: editingId, data: values });
        else createMut.mutate(values);
        setModalOpen(false);
    }

    function handleMovimento(values: MovimentoFormValues) {
        if (movimentoId == null) return;
        movimentoMut.mutate({
            prodottoId: movimentoId,
            tipo: values.tipo,
            quantita: parseNum(values.quantita),
            causale: values.causale,
            data: values.data,
            note: values.note,
        });
        setMovimentoId(null);
    }

    const detailProdotto = detailId != null ? prodotti.find((p) => p.id === detailId) ?? null : null;
    const editingProdotto = editingId != null ? prodotti.find((p) => p.id === editingId) ?? null : null;
    const movimentoProdotto = movimentoId != null ? prodotti.find((p) => p.id === movimentoId) ?? null : null;

    const detailMovimenti = useMemo(
        () => (detailId == null ? [] : movimenti.filter((m) => m.prodottoId === detailId).slice(0, 6)),
        [movimenti, detailId]
    );

    // ---- KPI derivati dal catalogo corrente ----
    const totaleArticoli = prodotti.length;
    const valoreMagazzino = prodotti.reduce((s, p) => s + valoreGiacenza(p), 0);
    const sottoScorta = prodotti.filter((p) => statoProdotto(p) === 'sotto-scorta').length;
    const esauriti = prodotti.filter((p) => statoProdotto(p) === 'esaurito').length;

    // Prossimo SKU suggerito, derivato dal catalogo (config/numbering.ts).
    const nextSku = useMemo(() => nextNumber(config.numbering.sku, prodotti.map((p) => p.sku)), [config.numbering.sku, prodotti]);

    return (
        <AppLayout pageClass="inventario-page">
            <Topbar>
                <h1>Gestione Inventario</h1>
                <p>Catalogo articoli, giacenze e movimenti di magazzino</p>
            </Topbar>

            <section className="kpi-grid">
                <div className="kpi-card" style={staggerStyle(0)}>
                    <div className="kpi-icon kpi-icon--stock"><i className="fa-solid fa-boxes-stacked" /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">Articoli a Catalogo</span>
                        <KpiValue value={String(totaleArticoli)} />
                        <span className="kpi-trend kpi-trend--up"><i className="fa-solid fa-arrow-trend-up" /> +3.4%</span>
                    </div>
                </div>
                <div className="kpi-card" style={staggerStyle(1)}>
                    <div className="kpi-icon kpi-icon--revenue"><i className="fa-solid fa-coins" /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">Valore Magazzino</span>
                        <KpiValue value={formatEuro(valoreMagazzino, 0)} />
                        <span className="kpi-trend kpi-trend--up"><i className="fa-solid fa-arrow-trend-up" /> +6.2%</span>
                    </div>
                </div>
                <div className="kpi-card" style={staggerStyle(2)}>
                    <div className="kpi-icon kpi-icon--warning"><i className="fa-solid fa-triangle-exclamation" /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">Sotto Scorta</span>
                        <KpiValue value={String(sottoScorta)} />
                        <span className="kpi-trend kpi-trend--down"><i className="fa-solid fa-arrow-trend-down" /> da riordinare</span>
                    </div>
                </div>
                <div className="kpi-card" style={staggerStyle(3)}>
                    <div className="kpi-icon kpi-icon--danger"><i className="fa-solid fa-circle-xmark" /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">Esauriti</span>
                        <KpiValue value={String(esauriti)} />
                        <span className="kpi-trend kpi-trend--down"><i className="fa-solid fa-arrow-trend-down" /> giacenza zero</span>
                    </div>
                </div>
            </section>

            <div style={staggerStyle(4)}>
                <ProductToolbar
                    search={search}
                    onSearchChange={handleSearchChange}
                    filter={filter}
                    onFilterChange={handleFilterChange}
                    categoria={categoria}
                    onCategoriaChange={handleCategoriaChange}
                    onExport={handleExport}
                    onAdd={perm.create ? () => { setEditingId(null); setModalOpen(true); } : undefined}
                />
            </div>

            <div style={staggerStyle(5)}>
                <ProductTable
                    rows={pageRows}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                    onView={setDetailId}
                    onMove={perm.update ? setMovimentoId : undefined}
                    onEdit={perm.update ? (id) => { setEditingId(id); setModalOpen(true); } : undefined}
                    onDelete={perm.delete ? handleDelete : undefined}
                    total={filtered.length}
                    currentPage={page}
                    totalPages={totalPages}
                    perPage={PER_PAGE}
                    onPageChange={setCurrentPage}
                />
            </div>

            <ProductDetailPanel
                prodotto={detailProdotto}
                movimenti={detailMovimenti}
                open={detailId != null}
                onClose={() => setDetailId(null)}
                onMove={perm.update ? () => { const id = detailId; setDetailId(null); setMovimentoId(id); } : undefined}
                onEdit={perm.update ? () => { const id = detailId; setDetailId(null); setEditingId(id); setModalOpen(true); } : undefined}
                onDelete={perm.delete ? () => { const id = detailId; setDetailId(null); if (id != null) handleDelete(id); } : undefined}
            />

            <ProdottoModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                editing={editingProdotto}
                onSubmit={handleSubmit}
                defaults={{ sku: nextSku }}
                fornitori={fornitoriNomi}
                saving={createMut.isPending || updateMut.isPending}
            />

            <MovimentoModal
                open={movimentoId != null}
                onClose={() => setMovimentoId(null)}
                prodotto={movimentoProdotto}
                onSubmit={handleMovimento}
                saving={movimentoMut.isPending}
            />
        </AppLayout>
    );
}
