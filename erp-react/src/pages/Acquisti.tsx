import { useMemo, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Topbar } from '../components/layout/Topbar';
import { DataTable, EntityCell, KpiGrid, ListToolbar, type Column, type RowAction } from '../components/data';
import { AcquistoDetailPanel } from '../components/acquisti/AcquistoDetailPanel';
import { AcquistoModal } from '../components/acquisti/AcquistoModal';
import { RicevimentoModal } from '../components/acquisti/RicevimentoModal';
import { RiordinoModal } from '../components/acquisti/RiordinoModal';
import type { StatoAction } from '../components/documenti/DocumentoParts';
import type { PanelAction } from '../components/ui/DetailPanelShell';
import { ActionButton } from '../components/ui/Button';
import { useToast } from '../components/ui/toastContext';
import { useConfirm } from '../components/ui/confirmContext';
import { useStagger } from '../hooks/useStagger';
import { useListState } from '../hooks/useListState';
import { useCrudDialogs } from '../hooks/useCrudDialogs';
import { useDeleteConfirm } from '../hooks/useDeleteConfirm';
import {
    useAcquisti, useCambiaStatoAcquisto, useCreateAcquistiBatch, useCreateAcquisto, useDeleteAcquisto,
    useFornitoriRef, useProdotti, useRiceviAcquisto, useUpdateAcquisto,
} from '../data';
import { usePermissions } from '../auth/hooks';
import { useConfig } from '../config/configStore';
import { formatNumber as formatCode, nextNumber } from '../config/numbering';
import { formatDate, formatEuro, formatNumber, today } from '../lib/format';
import { exportCsv } from '../lib/csv';
import { queryRows } from '../lib/listQuery';
import {
    acquistoAperto, acquistoEliminabile, acquistoInRitardo, acquistoMachine, acquistoModificabile, acquistoRicevibile,
    proposteRiordino, residuo, righeDaProposta, STATO_ACQUISTO_LABEL, totaliAcquisto,
    type AcquistoFormValues, type AcquistoStato, type OrdineAcquisto,
} from '../types/acquisto';
import '../styles/app-shell.css';
import '../styles/documenti.css';

type SortKey = 'numero' | 'fornitore' | 'data' | 'consegna' | 'totale' | 'stato';
type StatoFilter = 'all' | 'aperti' | AcquistoStato;

const STATO_CHIPS: { value: StatoFilter; label: string }[] = [
    { value: 'all', label: 'Tutti' },
    { value: 'aperti', label: 'Aperti' },
    { value: 'bozza', label: 'Bozze' },
    { value: 'parziale', label: 'Parziali' },
    { value: 'ricevuto', label: 'Ricevuti' },
];

const RANK: Record<AcquistoStato, number> = { bozza: 0, inviato: 1, parziale: 2, ricevuto: 3, annullato: 4 };

function sortValue(o: OrdineAcquisto, key: SortKey): string | number {
    if (key === 'totale') return totaliAcquisto(o).totale;
    if (key === 'stato') return RANK[o.stato];
    if (key === 'consegna') return o.consegna || '9999-99-99';
    return o[key];
}

/**
 * Ciclo passivo: ordini ai fornitori, ricevimento merce (carico automatico
 * con costo medio ponderato) e riordino suggerito dagli articoli sotto scorta.
 */
export function Acquisti() {
    const { toast } = useToast();
    const { confirm } = useConfirm();
    const confirmDelete = useDeleteConfirm();
    const stagger = useStagger();
    const oggi = today();
    const perm = usePermissions('ordini');
    const permMagazzino = usePermissions('magazzino');
    const config = useConfig();
    const { pageSize } = config;
    // Ricevere merce muove il magazzino: serve il permesso di aggiornarlo.
    const canReceive = permMagazzino.update;

    const { data: ordini = [] } = useAcquisti();
    const { data: fornitori = [] } = useFornitoriRef();
    const { data: prodotti = [] } = useProdotti();

    const list = useListState<SortKey, { stato: StatoFilter }>({ sort: { key: 'numero', dir: 'desc' }, filters: { stato: 'aperti' } });
    const dlg = useCrudDialogs(ordini);
    const [ricevimentoId, setRicevimentoId] = useState<number | null>(null);
    const [riordinoOpen, setRiordinoOpen] = useState(false);

    const onError = (e: Error) => toast(e.message, 'error');
    const createMut = useCreateAcquisto({ onSuccess: (o) => toast(`Ordine "${o.numero}" creato in bozza.`, 'success'), onError });
    const batchMut = useCreateAcquistiBatch({ onSuccess: (l) => toast(`${l.length} bozze di riordino create.`, 'success'), onError });
    const updateMut = useUpdateAcquisto({ onSuccess: (o) => toast(`Ordine "${o.numero}" aggiornato.`, 'success'), onError });
    const deleteMut = useDeleteAcquisto({ onSuccess: () => toast('Ordine eliminato.', 'info'), onError });
    const statoMut = useCambiaStatoAcquisto({
        onSuccess: (o) => toast(o.stato === 'inviato' ? `Ordine "${o.numero}" inviato al fornitore.` : `Ordine "${o.numero}" annullato.`, o.stato === 'annullato' ? 'info' : 'success'),
        onError,
    });
    const riceviMut = useRiceviAcquisto({
        onSuccess: (o) => toast(o.stato === 'ricevuto' ? `Ordine "${o.numero}" ricevuto: merce caricata a magazzino.` : `Ricevimento parziale registrato su "${o.numero}".`, 'success'),
        onError,
    });

    const nomeFornitore = useMemo(() => {
        const m = new Map(fornitori.map((f) => [f.id, f.nome]));
        return (id: number) => m.get(id) ?? '—';
    }, [fornitori]);

    const { stato } = list.filters;
    const result = useMemo(() => queryRows(ordini, {
        filters: stato === 'all' ? [] : [(o: OrdineAcquisto) => (stato === 'aperti' ? acquistoAperto(o.stato) : o.stato === stato)],
        search: list.search,
        searchFields: (o) => [o.numero, o.fornitore, ...o.righe.map((r) => r.nome), ...o.righe.map((r) => r.sku)],
        sort: { key: list.sortKey, dir: list.sortDir, value: sortValue },
        page: { current: list.page, size: pageSize },
    }), [ordini, stato, list.search, list.sortKey, list.sortDir, list.page, pageSize]);

    const proposte = useMemo(() => proposteRiordino(prodotti, ordini), [prodotti, ordini]);
    const numeroSuggerito = useMemo(() => nextNumber(config.numbering.acquisto, ordini.map((o) => o.numero)), [config.numbering.acquisto, ordini]);

    function handleSubmit(values: AcquistoFormValues) {
        if (dlg.editingId != null) updateMut.mutate({ id: dlg.editingId, data: values });
        else createMut.mutate(values);
        dlg.closeModal();
    }

    function creaBozzeRiordino() {
        // Numeri consecutivi a partire dal suggerito; la numerazione definitiva è del server.
        const rule = config.numbering.acquisto;
        const start = Number(numeroSuggerito.slice(rule.prefix.length)) || rule.start + 1;
        batchMut.mutate(proposte.map((p, i) => ({
            numero: formatCode(rule, start + i),
            fornitoreId: p.fornitoreId,
            data: oggi,
            consegna: '',
            note: 'Generato da riordino suggerito.',
            righe: righeDaProposta(p),
        })));
        setRiordinoOpen(false);
    }

    function annulla(o: OrdineAcquisto) {
        confirm({
            title: 'Annullare l’ordine?',
            text: `L'ordine "${o.numero}" a ${o.fornitore} verrà chiuso definitivamente.`,
            confirmLabel: 'Annulla ordine',
            icon: 'fa-ban',
            onConfirm: () => statoMut.mutate({ id: o.id, nuovo: 'annullato' }),
        });
    }

    function handleExport() {
        exportCsv('acquisti', result.filtered, [
            { header: 'Numero', value: (o) => o.numero },
            { header: 'Fornitore', value: (o) => o.fornitore },
            { header: 'Data', value: (o) => o.data },
            { header: 'Consegna', value: (o) => o.consegna },
            { header: 'Stato', value: (o) => STATO_ACQUISTO_LABEL[o.stato] },
            { header: 'Righe', value: (o) => o.righe.length },
            { header: 'Imponibile', value: (o) => totaliAcquisto(o).imponibile },
            { header: 'IVA', value: (o) => totaliAcquisto(o).iva },
            { header: 'Totale', value: (o) => totaliAcquisto(o).totale },
        ]);
        toast('Export CSV completato.', 'success');
    }

    const columns: Column<OrdineAcquisto, SortKey>[] = [
        { id: 'numero', header: 'Ordine', sortKey: 'numero', cell: (o) => <EntityCell icon={<i className="fa-solid fa-cart-flatbed" />} label={o.numero} onOpen={() => dlg.openDetail(o.id)} /> },
        { id: 'fornitore', header: 'Fornitore', sortKey: 'fornitore', cell: (o) => o.fornitore },
        { id: 'data', header: 'Data', sortKey: 'data', cell: (o) => formatDate(o.data) },
        {
            id: 'consegna', header: 'Consegna', sortKey: 'consegna',
            cell: (o) => (
                <>
                    {o.consegna ? formatDate(o.consegna) : '—'}
                    {acquistoInRitardo(o, oggi) && <span className="ritardo-tag"><i className="fa-solid fa-clock-rotate-left" /> in ritardo</span>}
                </>
            ),
        },
        {
            id: 'ricevuto', header: 'Ricevuto',
            cell: (o) => {
                const ord = o.righe.reduce((s, r) => s + r.quantita, 0);
                const ric = o.righe.reduce((s, r) => s + r.ricevuta, 0);
                return <><span className="progress-mini" aria-hidden="true"><span style={{ width: `${ord ? Math.round((ric / ord) * 100) : 0}%` }} /></span>{ord ? Math.round((ric / ord) * 100) : 0}%</>;
            },
        },
        { id: 'totale', header: 'Totale', sortKey: 'totale', className: 'cell-strong', cell: (o) => formatEuro(totaliAcquisto(o).totale) },
        { id: 'stato', header: 'Stato', sortKey: 'stato', cell: (o) => <span className={`status-badge status-badge--${o.stato}`}>{STATO_ACQUISTO_LABEL[o.stato]}</span> },
    ];

    const rowActions: RowAction<OrdineAcquisto>[] = [
        { id: 'view', icon: 'fa-eye', label: 'Dettaglio', onClick: (o) => dlg.openDetail(o.id) },
        ...(canReceive ? [{
            id: 'receive', icon: 'fa-dolly', label: 'Ricevi merce', onClick: (o: OrdineAcquisto) => setRicevimentoId(o.id),
            disabled: (o: OrdineAcquisto) => !acquistoRicevibile(o.stato) && 'Ordine non in attesa di merce',
        }] : []),
        ...(perm.create ? [{
            id: 'edit', icon: 'fa-pen', label: 'Modifica', onClick: (o: OrdineAcquisto) => dlg.openEdit(o.id),
            disabled: (o: OrdineAcquisto) => !acquistoModificabile(o.stato) && 'Solo le bozze sono modificabili',
        }] : []),
        ...(perm.delete ? [{
            id: 'delete', icon: 'fa-trash-can', label: 'Elimina', onClick: (o: OrdineAcquisto) => confirmDelete(`l'ordine "${o.numero}"`, () => deleteMut.mutate(o.id)),
            disabled: (o: OrdineAcquisto) => !acquistoEliminabile(o.stato) && 'Un ordine con merce ricevuta resta agli atti',
        }] : []),
    ];

    const detail = dlg.detail;
    const panelActions: PanelAction[] = detail ? [
        ...(perm.create ? [{ id: 'edit', label: 'Modifica', icon: 'fa-pen', variant: 'outline' as const, onClick: () => dlg.openEdit(detail.id), disabledReason: !acquistoModificabile(detail.stato) && 'Solo le bozze sono modificabili' }] : []),
        ...(perm.delete ? [{ id: 'delete', label: 'Elimina', icon: 'fa-trash-can', variant: 'danger' as const, onClick: () => { dlg.closeDetail(); confirmDelete(`l'ordine "${detail.numero}"`, () => deleteMut.mutate(detail.id)); }, disabledReason: !acquistoEliminabile(detail.stato) && 'Un ordine con merce ricevuta resta agli atti' }] : []),
    ] : [];

    const statoActions: StatoAction[] = detail ? [
        ...(perm.update && acquistoMachine.canTransition(detail.stato, 'inviato')
            ? [{ id: 'send', label: 'Segna come inviato', icon: 'fa-paper-plane', onClick: () => statoMut.mutate({ id: detail.id, nuovo: 'inviato' }) }] : []),
        ...(canReceive && acquistoRicevibile(detail.stato)
            ? [{ id: 'receive', label: 'Ricevi merce', icon: 'fa-dolly', onClick: () => setRicevimentoId(detail.id) }] : []),
        ...(perm.update && acquistoMachine.canTransition(detail.stato, 'annullato') && detail.righe.every((r) => r.ricevuta === 0)
            ? [{ id: 'cancel', label: 'Annulla ordine', icon: 'fa-ban', danger: true, onClick: () => annulla(detail) }] : []),
    ] : [];

    // KPI
    const aperti = ordini.filter((o) => acquistoAperto(o.stato) && o.stato !== 'bozza');
    const inArrivo = aperti.reduce((s, o) => s + o.righe.reduce((x, r) => x + residuo(r) * r.prezzo, 0), 0);
    const ritardi = ordini.filter((o) => acquistoInRitardo(o, oggi)).length;
    const articoliDaRiordinare = proposte.reduce((s, p) => s + p.righe.length, 0);

    return (
        <AppLayout pageClass="app-page">
            <Topbar>
                <h1>Acquisti</h1>
                <p>Ordini ai fornitori, ricevimento merce e riordino</p>
            </Topbar>

            <KpiGrid stagger={stagger} items={[
                { icon: 'fa-cart-flatbed', variant: 'orders', label: 'Ordini in Attesa', value: formatNumber(aperti.length), trend: { dir: 'up', text: 'inviati o parziali' } },
                { icon: 'fa-truck-ramp-box', variant: 'revenue', label: 'Merce in Arrivo', value: formatEuro(inArrivo, 0), trend: { dir: 'up', text: 'valore residuo' } },
                { icon: 'fa-clock-rotate-left', variant: 'warning', label: 'Consegne in Ritardo', value: formatNumber(ritardi), trend: { dir: 'down', text: 'da sollecitare' } },
                { icon: 'fa-triangle-exclamation', variant: 'danger', label: 'Da Riordinare', value: formatNumber(articoliDaRiordinare), trend: { dir: 'down', text: 'articoli sotto scorta' } },
            ]} />

            <div style={stagger(4)}>
                <ListToolbar
                    search={list.search}
                    onSearchChange={list.setSearch}
                    searchPlaceholder="Cerca per numero, fornitore o articolo..."
                    chips={{ label: 'Filtra per stato', value: stato, options: STATO_CHIPS, onChange: (v) => list.setFilter('stato', v) }}
                    onExport={perm.export ? handleExport : undefined}
                    onAdd={perm.create ? dlg.openCreate : undefined}
                    addLabel="Nuovo Ordine"
                >
                    {perm.create && (
                        <ActionButton variant="outline" icon="fa-wand-magic-sparkles" onClick={() => setRiordinoOpen(true)}>
                            Riordino suggerito{articoliDaRiordinare ? ` (${articoliDaRiordinare})` : ''}
                        </ActionButton>
                    )}
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
                    rowClassName={(o) => (acquistoInRitardo(o, oggi) ? 'row--alert' : undefined)}
                    empty={{ icon: 'fa-cart-flatbed', text: 'Nessun ordine d’acquisto trovato.' }}
                    pagination={{ total: result.filtered.length, page: result.page, totalPages: result.totalPages, pageSize, onPageChange: list.setPage }}
                />
            </div>

            <AcquistoDetailPanel
                ordine={detail}
                open={dlg.detailOpen}
                oggi={oggi}
                onClose={dlg.closeDetail}
                actions={panelActions}
                statoActions={statoActions}
                busy={statoMut.isPending || riceviMut.isPending}
            />

            <AcquistoModal
                open={dlg.modalOpen}
                onClose={dlg.closeModal}
                editing={dlg.editing}
                onSubmit={handleSubmit}
                saving={createMut.isPending || updateMut.isPending}
                fornitori={fornitori}
                prodotti={prodotti}
                numeroSuggerito={numeroSuggerito}
            />

            <RicevimentoModal
                key={ricevimentoId ?? 'none'}
                ordine={ordini.find((o) => o.id === ricevimentoId) ?? null}
                onClose={() => setRicevimentoId(null)}
                saving={riceviMut.isPending}
                onSubmit={(data, quantita) => {
                    if (ricevimentoId != null) riceviMut.mutate({ id: ricevimentoId, data, quantita });
                    setRicevimentoId(null);
                }}
            />

            <RiordinoModal
                open={riordinoOpen}
                proposte={proposte}
                nomeFornitore={nomeFornitore}
                onClose={() => setRiordinoOpen(false)}
                onConfirm={creaBozzeRiordino}
                saving={batchMut.isPending}
            />
        </AppLayout>
    );
}
