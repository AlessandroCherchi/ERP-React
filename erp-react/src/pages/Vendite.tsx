import { useMemo } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Topbar } from '../components/layout/Topbar';
import { DataTable, EntityCell, KpiGrid, ListToolbar, ToolbarSelect, type Column, type RowAction } from '../components/data';
import { OrdineDetailPanel } from '../components/vendite/OrdineDetailPanel';
import { OrdineModal } from '../components/vendite/OrdineModal';
import type { PanelAction } from '../components/ui/DetailPanelShell';
import { useToast } from '../components/ui/toastContext';
import { useConfirm } from '../components/ui/confirmContext';
import { useStagger } from '../hooks/useStagger';
import { useListState } from '../hooks/useListState';
import { useCrudDialogs } from '../hooks/useCrudDialogs';
import { useDeleteConfirm } from '../hooks/useDeleteConfirm';
import {
    DisponibilitaInsufficienteError, useCambiaStatoOrdine, useClientiSelezionabili, useCreateOrdine,
    useDeleteOrdine, useOrdini, useProdotti, useUpdateOrdine,
} from '../data';
import { usePermissions } from '../auth/hooks';
import { useConfig } from '../config/configStore';
import { nextNumber } from '../config/numbering';
import { formatDate, formatEuro, formatNumber, today } from '../lib/format';
import { exportCsv } from '../lib/csv';
import { queryRows } from '../lib/listQuery';
import {
    PRIORITA_LABEL, PRIORITA_OPTIONS, STATI_FILTRO, STATO_ORDINE_LABEL,
    inRitardo, ordineAperto, ordineEliminabile, ordineModificabile, totaliOrdine,
    type Ordine, type OrdineFormValues, type OrdinePriorita, type OrdineStato, type StatoFilter,
} from '../types/ordine';
import '../styles/app-shell.css';
import '../styles/vendite.css';

type SortKey = 'numero' | 'cliente' | 'data' | 'consegna' | 'pezzi' | 'totale' | 'priorita' | 'stato';
type PrioritaFilter = 'all' | OrdinePriorita;

const STATO_CHIPS: { value: StatoFilter; label: string }[] = [
    { value: 'all', label: 'Tutti' },
    { value: 'bozza', label: 'Bozze' },
    { value: 'in-corso', label: 'In corso' },
    { value: 'consegnato', label: 'Consegnati' },
    { value: 'annullato', label: 'Annullati' },
];

/**
 * Priorità e stato si ordinano per rilevanza, non per alfabeto: "urgente"
 * prima di "bassa", e il ciclo di vita nel suo ordine naturale.
 */
const RANK_PRIORITA: Record<OrdinePriorita, number> = { urgente: 0, alta: 1, normale: 2, bassa: 3 };
const RANK_STATO: Record<OrdineStato, number> = {
    bozza: 0, confermato: 1, 'in-preparazione': 2, spedito: 3, consegnato: 4, annullato: 5,
};

function sortValue(o: Ordine, key: SortKey): string | number {
    switch (key) {
        case 'pezzi': return totaliOrdine(o.righe).pezzi;
        case 'totale': return totaliOrdine(o.righe).totale;
        case 'priorita': return RANK_PRIORITA[o.priorita];
        case 'stato': return RANK_STATO[o.stato];
        // Date ISO: ordinamento lessicografico = cronologico; consegna vuota in fondo.
        case 'consegna': return o.consegna || '9999-99-99';
        default: return o[key];
    }
}

export function Vendite() {
    const { toast } = useToast();
    const { confirm } = useConfirm();
    const confirmDelete = useDeleteConfirm();
    const stagger = useStagger();
    const oggi = today();
    const perm = usePermissions('ordini');
    const config = useConfig();
    const { pageSize } = config;
    // "Limitato" (§5): il magazzino avanza lo stato ma non modifica il
    // contenuto commerciale del documento, che resta a chi può crearlo.
    const canEdit = perm.create;

    const { data: ordini = [] } = useOrdini();
    const { data: clienti = [] } = useClientiSelezionabili();
    // Il catalogo serve all'editor righe: prezzi di listino e disponibilità.
    const { data: prodotti = [] } = useProdotti();

    const list = useListState<SortKey, { stato: StatoFilter; priorita: PrioritaFilter; ritardo: '' | '1' }>({
        sort: { key: 'numero', dir: 'desc' },
        filters: { stato: 'all', priorita: 'all', ritardo: '' },
    });
    const dlg = useCrudDialogs(ordini);

    // Le invalidazioni (ordini; giacenze e movimenti per le transizioni) sono
    // negli hook di data/hooks.ts: qui resta solo il feedback all'operatore.
    const createMut = useCreateOrdine({ onSuccess: (o) => toast(`Ordine "${o.numero}" creato in bozza.`, 'success') });
    const updateMut = useUpdateOrdine({
        onSuccess: (o) => toast(`Ordine "${o.numero}" aggiornato.`, 'success'),
        onError: (e) => toast(e.message, 'error'),
    });
    const deleteMut = useDeleteOrdine({
        onSuccess: () => toast('Ordine eliminato.', 'info'),
        onError: (e) => toast(e.message, 'error'),
    });
    const statoMut = useCambiaStatoOrdine({
        onSuccess: (o) => toast(
            o.stato === 'confermato'
                ? `Ordine "${o.numero}" confermato: merce scaricata dal magazzino.`
                : o.stato === 'annullato'
                    ? `Ordine "${o.numero}" annullato. Le quantità impegnate sono rientrate in giacenza.`
                    : `Ordine "${o.numero}": stato aggiornato a "${STATO_ORDINE_LABEL[o.stato]}".`,
            o.stato === 'annullato' ? 'info' : 'success'
        ),
        onError: (e) => {
            // L'unico errore risolvibile dall'operatore è la giacenza: dire
            // quali articoli mancano e di quanto vale più di "operazione fallita".
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

    const { stato, priorita, ritardo } = list.filters;
    const result = useMemo(() => queryRows(ordini, {
        filters: [
            ...(stato === 'all' ? [] : [(o: Ordine) => STATI_FILTRO[stato].includes(o.stato)]),
            ...(priorita === 'all' ? [] : [(o: Ordine) => o.priorita === priorita]),
            ...(ritardo ? [(o: Ordine) => inRitardo(o, oggi)] : []),
        ],
        search: list.search,
        searchFields: (o) => [o.numero, o.cliente, ...o.righe.map((r) => r.nome), ...o.righe.map((r) => r.sku)],
        sort: { key: list.sortKey, dir: list.sortDir, value: sortValue },
        page: { current: list.page, size: pageSize },
    }), [ordini, stato, priorita, ritardo, list.search, list.sortKey, list.sortDir, list.page, pageSize, oggi]);

    function handleDelete(o: Ordine) {
        confirmDelete(`l'ordine "${o.numero}" di ${o.cliente}`, () => deleteMut.mutate(o.id));
    }

    function handleCambiaStato(o: Ordine, nuovo: OrdineStato) {
        // Conferma solo per l'annullamento: chiude il documento senza ritorno.
        if (nuovo !== 'annullato') {
            statoMut.mutate({ id: o.id, nuovo });
            return;
        }
        confirm({
            title: 'Annullare l’ordine?',
            text: `L'ordine "${o.numero}" verrà chiuso definitivamente.`
                + (o.stato !== 'bozza' ? ' Le quantità già scaricate rientreranno in giacenza con un movimento di storno.' : ''),
            confirmLabel: 'Annulla ordine',
            icon: 'fa-ban',
            onConfirm: () => statoMut.mutate({ id: o.id, nuovo }),
        });
    }

    function handleSubmit(values: OrdineFormValues) {
        if (dlg.editingId != null) updateMut.mutate({ id: dlg.editingId, data: values });
        else createMut.mutate(values);
        dlg.closeModal();
    }

    function handleExport() {
        exportCsv('ordini', result.filtered.map((o) => ({ o, t: totaliOrdine(o.righe) })), [
            { header: 'Numero', value: ({ o }) => o.numero },
            { header: 'Cliente', value: ({ o }) => o.cliente },
            { header: 'Data', value: ({ o }) => o.data },
            { header: 'Consegna', value: ({ o }) => o.consegna },
            { header: 'Stato', value: ({ o }) => STATO_ORDINE_LABEL[o.stato] },
            { header: 'Priorità', value: ({ o }) => PRIORITA_LABEL[o.priorita] },
            { header: 'Righe', value: ({ o }) => o.righe.length },
            { header: 'Pezzi', value: ({ t }) => t.pezzi },
            { header: 'Imponibile', value: ({ t }) => t.imponibile },
            { header: 'IVA', value: ({ t }) => t.iva },
            { header: 'Totale', value: ({ t }) => t.totale },
            { header: 'In ritardo', value: ({ o }) => (inRitardo(o, oggi) ? 'Sì' : 'No') },
            { header: 'Note', value: ({ o }) => o.note },
        ]);
        toast('Export CSV completato.', 'success');
    }

    const columns: Column<Ordine, SortKey>[] = [
        { id: 'numero', header: 'Ordine', sortKey: 'numero', cell: (o) => <EntityCell icon={<i className="fa-solid fa-receipt" />} label={o.numero} onOpen={() => dlg.openDetail(o.id)} /> },
        { id: 'cliente', header: 'Cliente', sortKey: 'cliente', cell: (o) => o.cliente || '—' },
        { id: 'data', header: 'Data', sortKey: 'data', cell: (o) => formatDate(o.data) },
        {
            id: 'consegna', header: 'Consegna', sortKey: 'consegna',
            cell: (o) => (
                <>
                    {o.consegna ? formatDate(o.consegna) : '—'}
                    {inRitardo(o, oggi) && (
                        <span className="ritardo-tag" title="Consegna scaduta con ordine ancora aperto">
                            <i className="fa-solid fa-clock-rotate-left" /> in ritardo
                        </span>
                    )}
                </>
            ),
        },
        { id: 'pezzi', header: 'Articoli', sortKey: 'pezzi', cell: (o) => formatNumber(totaliOrdine(o.righe).pezzi) },
        { id: 'totale', header: 'Totale', sortKey: 'totale', className: 'cell-strong', cell: (o) => formatEuro(totaliOrdine(o.righe).totale) },
        { id: 'priorita', header: 'Priorità', sortKey: 'priorita', cell: (o) => <span className={`priorita-tag priorita-tag--${o.priorita}`}>{PRIORITA_LABEL[o.priorita]}</span> },
        { id: 'stato', header: 'Stato', sortKey: 'stato', cell: (o) => <span className={`status-badge status-badge--${o.stato}`}>{STATO_ORDINE_LABEL[o.stato]}</span> },
    ];

    const rowActions: RowAction<Ordine>[] = [
        { id: 'view', icon: 'fa-eye', label: 'Dettaglio', onClick: (o) => dlg.openDetail(o.id) },
        ...(canEdit ? [{
            id: 'edit', icon: 'fa-pen', label: 'Modifica', onClick: (o: Ordine) => dlg.openEdit(o.id),
            disabled: (o: Ordine) => !ordineModificabile(o.stato) && 'Solo le bozze sono modificabili',
        }] : []),
        ...(perm.delete ? [{
            id: 'delete', icon: 'fa-trash-can', label: 'Elimina', onClick: handleDelete,
            disabled: (o: Ordine) => !ordineEliminabile(o.stato) && 'Un ordine confermato resta agli atti',
        }] : []),
    ];

    const detail = dlg.detail;
    const panelActions: PanelAction[] = detail ? [
        ...(canEdit ? [{
            id: 'edit', label: 'Modifica', icon: 'fa-pen', variant: 'outline' as const, onClick: () => dlg.openEdit(detail.id),
            disabledReason: !ordineModificabile(detail.stato) && 'Solo le bozze sono modificabili',
        }] : []),
        ...(perm.delete ? [{
            id: 'delete', label: 'Elimina', icon: 'fa-trash-can', variant: 'danger' as const,
            onClick: () => { dlg.closeDetail(); handleDelete(detail); },
            disabledReason: !ordineEliminabile(detail.stato) && 'Un ordine confermato resta agli atti',
        }] : []),
    ] : [];

    const numeroSuggerito = useMemo(
        () => nextNumber(config.numbering.ordine, ordini.map((o) => o.numero)),
        [config.numbering.ordine, ordini]
    );

    // KPI derivati
    const aperti = ordini.filter((o) => ordineAperto(o.stato));
    const valorePortafoglio = aperti.reduce((s, o) => s + totaliOrdine(o.righe).totale, 0);
    const ritardi = ordini.filter((o) => inRitardo(o, oggi)).length;
    // Ticket medio sugli ordini che hanno prodotto valore: gli annullati falserebbero la media.
    const validi = ordini.filter((o) => o.stato !== 'annullato');
    const ticketMedio = validi.length ? validi.reduce((s, o) => s + totaliOrdine(o.righe).totale, 0) / validi.length : 0;

    return (
        <AppLayout pageClass="vendite-page">
            <Topbar>
                <h1>Gestione Vendite</h1>
                <p>Ordini cliente, avanzamento e impegno di magazzino</p>
            </Topbar>

            <KpiGrid stagger={stagger} items={[
                { icon: 'fa-cart-shopping', variant: 'orders', label: 'Ordini Aperti', value: formatNumber(aperti.length), trend: { dir: 'up', text: `su ${ordini.length} totali` } },
                { icon: 'fa-euro-sign', variant: 'revenue', label: 'Portafoglio Ordini', value: formatEuro(valorePortafoglio, 0), trend: { dir: 'up', text: 'da evadere' } },
                { icon: 'fa-clock-rotate-left', variant: 'warning', label: 'In Ritardo', value: formatNumber(ritardi), trend: { dir: 'down', text: 'consegna scaduta' } },
                { icon: 'fa-receipt', variant: 'active', label: 'Ticket Medio', value: formatEuro(ticketMedio, 0), trend: { dir: 'up', text: 'per ordine' } },
            ]} />

            <div style={stagger(4)}>
                <ListToolbar
                    search={list.search}
                    onSearchChange={list.setSearch}
                    searchPlaceholder="Cerca per numero, cliente o articolo..."
                    chips={{ label: 'Filtra per stato', value: stato, options: STATO_CHIPS, onChange: (v) => list.setFilter('stato', v) }}
                    onExport={perm.export ? handleExport : undefined}
                    onAdd={perm.create ? dlg.openCreate : undefined}
                    addLabel="Nuovo Ordine"
                >
                    <ToolbarSelect
                        label="Filtra per priorità"
                        value={priorita}
                        onChange={(v) => list.setFilter('priorita', v)}
                        options={[{ value: 'all', label: 'Tutte le priorità' }, ...PRIORITA_OPTIONS]}
                    />
                    {/* Il ritardo è un asse indipendente dallo stato: un ordine può essere
                        "in corso" e in ritardo insieme, quindi è un interruttore a sé. */}
                    <button
                        type="button"
                        className={`chip-btn chip-btn--toggle${ritardo ? ' active' : ''}`}
                        aria-pressed={Boolean(ritardo)}
                        onClick={() => list.setFilter('ritardo', ritardo ? '' : '1')}
                    >
                        <i className="fa-solid fa-clock-rotate-left" /> Solo in ritardo
                    </button>
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
                    rowLabel={(o) => `ordine ${o.numero}`}
                    rowClassName={(o) => (inRitardo(o, oggi) ? 'row--alert' : undefined)}
                    empty={{ icon: 'fa-cart-shopping', text: 'Nessun ordine trovato.' }}
                    pagination={{ total: result.filtered.length, page: result.page, totalPages: result.totalPages, pageSize, onPageChange: list.setPage }}
                />
            </div>

            <OrdineDetailPanel
                ordine={detail}
                open={dlg.detailOpen}
                oggi={oggi}
                onClose={dlg.closeDetail}
                actions={panelActions}
                canTransition={perm.transition}
                // Il pannello resta aperto: dopo una conferma l'operatore vuole
                // vedere il nuovo stato e le azioni successive.
                onCambiaStato={(nuovo) => detail && handleCambiaStato(detail, nuovo)}
                busy={statoMut.isPending}
            />

            <OrdineModal
                open={dlg.modalOpen}
                onClose={dlg.closeModal}
                editing={dlg.editing}
                onSubmit={handleSubmit}
                saving={createMut.isPending || updateMut.isPending}
                clienti={clienti}
                prodotti={prodotti}
                numeroSuggerito={numeroSuggerito}
            />
        </AppLayout>
    );
}
