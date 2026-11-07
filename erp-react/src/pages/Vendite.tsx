import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '../components/layout/AppLayout';
import { Topbar } from '../components/layout/Topbar';
import { KpiValue } from '../components/ui/KpiValue';
import { OrdineToolbar, type PrioritaFilter } from '../components/vendite/OrdineToolbar';
import { OrdineTable, type SortKey } from '../components/vendite/OrdineTable';
import { OrdineDetailPanel } from '../components/vendite/OrdineDetailPanel';
import { OrdineModal } from '../components/vendite/OrdineModal';
import { useToast } from '../components/ui/Toast';
import { useConfirm } from '../components/ui/Confirm';
import { useStagger } from '../hooks/useStagger';
import { downloadCsv, formatEuro, today } from '../lib/format';
import { matchesQuery, paginate, sortRows, type SortDir } from '../lib/tableUtils';
import {
    cambiaStatoOrdine, createOrdine, deleteOrdine, fetchOrdini, updateOrdine,
} from '../lib/mockApi/ordini';
import { DisponibilitaInsufficienteError } from '../lib/mockApi/inventario';
import { fetchClientiSelezionabili } from '../lib/mockApi/clienti';
import { fetchProdotti } from '../lib/mockApi/inventario';
import {
    PRIORITA_LABEL, STATI_FILTRO, STATO_ORDINE_LABEL, inRitardo, ordineAperto,
    prossimoNumeroOrdine, totaliOrdine,
    type Ordine, type OrdineFormValues, type OrdineStato, type StatoFilter,
} from '../types/ordine';
import '../styles/app-shell.css';
import '../styles/vendite.css';

const PER_PAGE = 10;

/**
 * Ordinamento di priorità e stato per rilevanza, non per alfabeto:
 * "alta" prima di "bassa" è ciò che l'operatore si aspetta, mentre
 * l'ordine alfabetico metterebbe "Annullato" in cima al ciclo di vita.
 */
const RANK_PRIORITA: Record<string, number> = { urgente: 0, alta: 1, normale: 2, bassa: 3 };
const RANK_STATO: Record<OrdineStato, number> = {
    bozza: 0, confermato: 1, 'in-preparazione': 2, spedito: 3, consegnato: 4, annullato: 5,
};

/** Valore confrontabile per ciascuna colonna ordinabile. */
function sortValue(o: Ordine, key: SortKey): string | number {
    switch (key) {
        case 'pezzi': return totaliOrdine(o.righe).pezzi;
        case 'totale': return totaliOrdine(o.righe).totale;
        case 'priorita': return RANK_PRIORITA[o.priorita] ?? 99;
        case 'stato': return RANK_STATO[o.stato];
        // Le date sono ISO: l'ordinamento lessicografico coincide con quello
        // cronologico, e la consegna vuota finisce in fondo.
        case 'consegna': return o.consegna || '9999-99-99';
        default: return o[key];
    }
}

export function Vendite() {
    const { toast } = useToast();
    const { confirm } = useConfirm();
    const queryClient = useQueryClient();
    const staggerStyle = useStagger();
    const oggi = today();

    const { data: ordini = [] } = useQuery({ queryKey: ['ordini'], queryFn: fetchOrdini });
    const { data: clienti = [] } = useQuery({ queryKey: ['clienti', 'ref'], queryFn: fetchClientiSelezionabili });
    // Il catalogo serve all'editor righe: prezzi di listino e disponibilità.
    const { data: prodotti = [] } = useQuery({ queryKey: ['prodotti'], queryFn: fetchProdotti });

    const [search, setSearch] = useState('');
    const [stato, setStato] = useState<StatoFilter>('all');
    const [priorita, setPriorita] = useState<PrioritaFilter>('all');
    const [soloRitardo, setSoloRitardo] = useState(false);
    const [sortKey, setSortKey] = useState<SortKey>('numero');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [currentPage, setCurrentPage] = useState(1);

    const [detailId, setDetailId] = useState<number | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['ordini'] });

    /** Una transizione può aver mosso il magazzino: giacenze e movimenti sono stale. */
    const invalidateMagazzino = () => {
        queryClient.invalidateQueries({ queryKey: ['prodotti'] });
        queryClient.invalidateQueries({ queryKey: ['movimenti'] });
    };

    const createMut = useMutation({
        mutationFn: createOrdine,
        onSuccess: (o) => {
            invalidate();
            toast(`Ordine "${o.numero}" creato in bozza.`, 'success');
        },
    });

    const updateMut = useMutation({
        mutationFn: ({ id, data }: { id: number; data: OrdineFormValues }) => updateOrdine(id, data),
        onSuccess: (o) => {
            invalidate();
            toast(`Ordine "${o.numero}" aggiornato.`, 'success');
        },
        onError: (e: Error) => toast(e.message, 'error'),
    });

    const deleteMut = useMutation({
        mutationFn: deleteOrdine,
        onSuccess: (_v, id) => {
            invalidate();
            toast(`Ordine "${ordini.find((o) => o.id === id)?.numero}" eliminato.`, 'info');
        },
        onError: (e: Error) => toast(e.message, 'error'),
    });

    const statoMut = useMutation({
        mutationFn: ({ id, nuovo }: { id: number; nuovo: OrdineStato }) => cambiaStatoOrdine(id, nuovo),
        onSuccess: (o) => {
            invalidate();
            invalidateMagazzino();
            toast(
                o.stato === 'confermato'
                    ? `Ordine "${o.numero}" confermato: merce scaricata dal magazzino.`
                    : o.stato === 'annullato'
                        ? `Ordine "${o.numero}" annullato. Le quantità impegnate sono rientrate in giacenza.`
                        : `Ordine "${o.numero}": stato aggiornato a "${STATO_ORDINE_LABEL[o.stato]}".`,
                o.stato === 'annullato' ? 'info' : 'success'
            );
        },
        onError: (e: Error) => {
            // L'unico errore che l'operatore può risolvere è la giacenza:
            // dirgli quali articoli mancano e di quanto vale più di
            // "operazione fallita".
            if (e instanceof DisponibilitaInsufficienteError) {
                const dettaglio = e.scoperti
                    .map((s) => `${s.nome} (richiesti ${s.richiesta}, disponibili ${s.disponibile})`)
                    .join('; ');
                toast(`Conferma rifiutata — giacenza insufficiente: ${dettaglio}.`, 'error');
                return;
            }
            toast(e.message, 'error');
        },
    });

    const filtered = useMemo(() => {
        let list = ordini;
        if (stato !== 'all') {
            const ammessi = STATI_FILTRO[stato];
            list = list.filter((o) => ammessi.includes(o.stato));
        }
        if (priorita !== 'all') list = list.filter((o) => o.priorita === priorita);
        if (soloRitardo) list = list.filter((o) => inRitardo(o, oggi));
        list = list.filter((o) =>
            matchesQuery(o, search, (x) => [x.numero, x.cliente, ...x.righe.map((r) => r.nome), ...x.righe.map((r) => r.sku)])
        );
        return sortRows(list, sortKey, sortDir, sortValue);
    }, [ordini, stato, priorita, soloRitardo, search, sortKey, sortDir, oggi]);

    const { page, totalPages, rows: pageRows } = paginate(filtered, currentPage, PER_PAGE);

    function handleSort(key: SortKey) {
        if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        else { setSortKey(key); setSortDir('asc'); }
    }

    function handleStatoChange(s: StatoFilter) { setStato(s); setCurrentPage(1); }
    function handlePrioritaChange(p: PrioritaFilter) { setPriorita(p); setCurrentPage(1); }
    function handleSearchChange(v: string) { setSearch(v); setCurrentPage(1); }
    function handleRitardoChange(v: boolean) { setSoloRitardo(v); setCurrentPage(1); }

    function handleExport() {
        const headers = ['Numero', 'Cliente', 'Data', 'Consegna', 'Stato', 'Priorità', 'Righe', 'Pezzi', 'Imponibile', 'IVA', 'Totale', 'In ritardo', 'Note'];
        const rows = filtered.map((o) => {
            const t = totaliOrdine(o.righe);
            return [
                o.numero, o.cliente, o.data, o.consegna,
                STATO_ORDINE_LABEL[o.stato], PRIORITA_LABEL[o.priorita],
                o.righe.length, t.pezzi, t.imponibile, t.iva, t.totale,
                inRitardo(o, oggi) ? 'Sì' : 'No', o.note,
            ];
        });
        downloadCsv(`ordini_export_${oggi}.csv`, headers, rows);
        toast('Export CSV completato.', 'success');
    }

    function handleDelete(id: number) {
        const o = ordini.find((x) => x.id === id);
        if (!o) return;
        confirm({
            title: 'Conferma Eliminazione',
            text: `Sei sicuro di voler eliminare l'ordine "${o.numero}" di ${o.cliente}? L'azione è irreversibile.`,
            confirmLabel: 'Elimina',
            icon: 'fa-trash-can',
            onConfirm: () => deleteMut.mutate(id),
        });
    }

    function handleCambiaStato(id: number, nuovo: OrdineStato) {
        const o = ordini.find((x) => x.id === id);
        if (!o) return;

        // Si chiede conferma solo per l'annullamento: è l'unica transizione
        // che chiude il documento senza possibilità di tornare indietro.
        if (nuovo === 'annullato') {
            confirm({
                title: 'Annullare l’ordine?',
                text: `L'ordine "${o.numero}" verrà chiuso definitivamente.`
                    + (o.stato !== 'bozza'
                        ? ' Le quantità già scaricate rientreranno in giacenza con un movimento di storno.'
                        : ''),
                confirmLabel: 'Annulla ordine',
                icon: 'fa-ban',
                onConfirm: () => statoMut.mutate({ id, nuovo }),
            });
            return;
        }

        statoMut.mutate({ id, nuovo });
    }

    function handleSubmit(values: OrdineFormValues) {
        if (editingId) updateMut.mutate({ id: editingId, data: values });
        else createMut.mutate(values);
        setModalOpen(false);
    }

    const detailOrdine = detailId != null ? ordini.find((o) => o.id === detailId) ?? null : null;
    const editingOrdine = editingId != null ? ordini.find((o) => o.id === editingId) ?? null : null;
    const numeroSuggerito = useMemo(() => prossimoNumeroOrdine(ordini), [ordini]);

    // ---- KPI derivati ----
    const aperti = ordini.filter((o) => ordineAperto(o.stato));
    const valorePortafoglio = aperti.reduce((s, o) => s + totaliOrdine(o.righe).totale, 0);
    const ritardi = ordini.filter((o) => inRitardo(o, oggi)).length;
    // Il ticket medio si calcola sugli ordini che hanno prodotto valore:
    // includere gli annullati abbasserebbe la media raccontando una cosa falsa.
    const fatturabili = ordini.filter((o) => o.stato !== 'annullato');
    const ticketMedio = fatturabili.length
        ? fatturabili.reduce((s, o) => s + totaliOrdine(o.righe).totale, 0) / fatturabili.length
        : 0;

    return (
        <AppLayout pageClass="vendite-page">
            <Topbar>
                <h1>Gestione Vendite</h1>
                <p>Ordini cliente, avanzamento e impegno di magazzino</p>
            </Topbar>

            <section className="kpi-grid">
                <div className="kpi-card" style={staggerStyle(0)}>
                    <div className="kpi-icon kpi-icon--orders"><i className="fa-solid fa-cart-shopping" /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">Ordini Aperti</span>
                        <KpiValue value={String(aperti.length)} />
                        <span className="kpi-trend kpi-trend--up"><i className="fa-solid fa-arrow-trend-up" /> su {ordini.length} totali</span>
                    </div>
                </div>
                <div className="kpi-card" style={staggerStyle(1)}>
                    <div className="kpi-icon kpi-icon--revenue"><i className="fa-solid fa-euro-sign" /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">Portafoglio Ordini</span>
                        <KpiValue value={formatEuro(valorePortafoglio, 0)} />
                        <span className="kpi-trend kpi-trend--up"><i className="fa-solid fa-arrow-trend-up" /> da evadere</span>
                    </div>
                </div>
                <div className="kpi-card" style={staggerStyle(2)}>
                    <div className="kpi-icon kpi-icon--warning"><i className="fa-solid fa-clock-rotate-left" /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">In Ritardo</span>
                        <KpiValue value={String(ritardi)} />
                        <span className="kpi-trend kpi-trend--down"><i className="fa-solid fa-arrow-trend-down" /> consegna scaduta</span>
                    </div>
                </div>
                <div className="kpi-card" style={staggerStyle(3)}>
                    <div className="kpi-icon kpi-icon--active"><i className="fa-solid fa-receipt" /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">Ticket Medio</span>
                        <KpiValue value={formatEuro(ticketMedio, 0)} />
                        <span className="kpi-trend kpi-trend--up"><i className="fa-solid fa-arrow-trend-up" /> per ordine</span>
                    </div>
                </div>
            </section>

            <div style={staggerStyle(4)}>
                <OrdineToolbar
                    search={search}
                    onSearchChange={handleSearchChange}
                    stato={stato}
                    onStatoChange={handleStatoChange}
                    priorita={priorita}
                    onPrioritaChange={handlePrioritaChange}
                    soloRitardo={soloRitardo}
                    onSoloRitardoChange={handleRitardoChange}
                    onExport={handleExport}
                    onAdd={() => { setEditingId(null); setModalOpen(true); }}
                />
            </div>

            <div style={staggerStyle(5)}>
                <OrdineTable
                    rows={pageRows}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                    onView={setDetailId}
                    onEdit={(id) => { setEditingId(id); setModalOpen(true); }}
                    onDelete={handleDelete}
                    oggi={oggi}
                    total={filtered.length}
                    currentPage={page}
                    totalPages={totalPages}
                    perPage={PER_PAGE}
                    onPageChange={setCurrentPage}
                />
            </div>

            <OrdineDetailPanel
                ordine={detailOrdine}
                open={detailId != null}
                oggi={oggi}
                onClose={() => setDetailId(null)}
                onEdit={() => { const id = detailId; setDetailId(null); setEditingId(id); setModalOpen(true); }}
                onDelete={() => { const id = detailId; setDetailId(null); if (id != null) handleDelete(id); }}
                onCambiaStato={(nuovo) => {
                    if (detailId == null) return;
                    // Il pannello resta aperto: dopo una conferma l'operatore
                    // vuole vedere il nuovo stato e le azioni successive.
                    handleCambiaStato(detailId, nuovo);
                }}
                busy={statoMut.isPending}
            />

            <OrdineModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                editing={editingOrdine}
                onSubmit={handleSubmit}
                saving={createMut.isPending || updateMut.isPending}
                clienti={clienti}
                prodotti={prodotti}
                numeroSuggerito={numeroSuggerito}
            />
        </AppLayout>
    );
}
