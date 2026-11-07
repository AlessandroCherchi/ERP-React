import { useMemo, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Topbar } from '../components/layout/Topbar';
import { DataTable, EntityCell, KpiGrid, ListToolbar, ToolbarSelect, type Column, type RowAction } from '../components/data';
import { FatturaDetailPanel } from '../components/fatture/FatturaDetailPanel';
import { FatturaModal } from '../components/fatture/FatturaModal';
import { DaOrdiniModal } from '../components/fatture/DaOrdiniModal';
import { IncassoModal } from '../components/fatture/IncassoModal';
import { printableFattura } from '../components/fatture/printable';
import { PrintPreview, type PrintableDocument } from '../components/documenti/PrintPreview';
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
    useClientiSelezionabili, useCreateFattura, useDeleteFattura, useEliminaIncasso, useEmettiFattura, useFatture,
    useIncassi, useInviaSdi, useOrdini, useProdotti, useRegistraIncasso, useUpdateFattura,
} from '../data';
import { usePermissions, useCan } from '../auth/hooks';
import { useConfig } from '../config/configStore';
import { formatDate, formatEuro, formatNumber, today } from '../lib/format';
import { exportCsv } from '../lib/csv';
import { queryRows } from '../lib/listQuery';
import {
    fatturaInviabile, fatturaModificabile, isNotaCredito, notaCreditoDa, ordiniGiaFatturati, righeDaOrdini, situazione,
    STATO_PAGAMENTO_LABEL, STATO_SDI_LABEL, TIPO_DOCUMENTO_LABEL, totaliFattura,
    type Fattura, type FatturaFormValues, type StatoPagamento, type StatoSdi, type TipoDocumento,
} from '../types/fattura';
import '../styles/app-shell.css';
import '../styles/documenti.css';

type SortKey = 'numero' | 'cliente' | 'data' | 'totale' | 'scadenza';
type StatoFilter = 'all' | 'bozze' | StatoPagamento;

const STATO_CHIPS: { value: StatoFilter; label: string }[] = [
    { value: 'all', label: 'Tutti' },
    { value: 'bozze', label: 'Bozze' },
    { value: 'da-incassare', label: 'Da incassare' },
    { value: 'scaduta', label: 'Scadute' },
    { value: 'pagata', label: 'Pagate' },
];

/**
 * Ciclo attivo: bozze di fattura (anche da ordini consegnati), emissione,
 * invio SDI con esito, incassi e note di credito. Numerazione e SDI sono
 * operazioni del backend (qui simulate dall'adapter, vedi lib/mockApi/fatture.ts).
 */
export function Fatture() {
    const { toast } = useToast();
    const { confirm } = useConfirm();
    const confirmDelete = useDeleteConfirm();
    const stagger = useStagger();
    const oggi = today();
    const perm = usePermissions('fatture');
    const can = useCan();
    const canSdi = can('sdi', 'submit');
    const { pageSize } = useConfig();

    const { data: fatture = [] } = useFatture();
    const { data: incassi = [] } = useIncassi();
    const { data: ordini = [] } = useOrdini();
    const { data: clienti = [] } = useClientiSelezionabili();
    const { data: prodotti = [] } = useProdotti();

    const list = useListState<SortKey, { stato: StatoFilter; tipo: 'all' | TipoDocumento; sdi: 'all' | StatoSdi }>({
        sort: { key: 'data', dir: 'desc' },
        filters: { stato: 'all', tipo: 'all', sdi: 'all' },
    });
    const dlg = useCrudDialogs(fatture);
    const [initial, setInitial] = useState<FatturaFormValues | null>(null);
    const [daOrdiniOpen, setDaOrdiniOpen] = useState(false);
    const [incassoId, setIncassoId] = useState<number | null>(null);
    const [stampa, setStampa] = useState<PrintableDocument | null>(null);

    const onError = (e: Error) => toast(e.message, 'error');
    const createMut = useCreateFattura({ onSuccess: () => toast('Bozza salvata.', 'success'), onError });
    const updateMut = useUpdateFattura({ onSuccess: () => toast('Bozza aggiornata.', 'success'), onError });
    const deleteMut = useDeleteFattura({ onSuccess: () => toast('Bozza eliminata.', 'info'), onError });
    const emettiMut = useEmettiFattura({ onSuccess: (f) => toast(`Documento emesso con numero ${f.numero}.`, 'success'), onError });
    const sdiMut = useInviaSdi({
        onSuccess: (f) => toast(
            f.sdi === 'consegnata' ? `Fattura ${f.numero} consegnata al cliente.` : f.sdi === 'scartata' ? `Fattura ${f.numero} scartata dallo SDI: ${f.esitoSdi?.descrizione}.` : `Fattura ${f.numero}: ${f.esitoSdi?.descrizione}.`,
            f.sdi === 'scartata' ? 'error' : f.sdi === 'consegnata' ? 'success' : 'info'
        ),
        onError,
    });
    const incassoMut = useRegistraIncasso({ onSuccess: (i) => toast(`Incasso di ${formatEuro(i.importo)} registrato.`, 'success'), onError });
    const eliminaIncassoMut = useEliminaIncasso({ onSuccess: () => toast('Incasso eliminato.', 'info'), onError });

    const situazioni = useMemo(
        () => new Map(fatture.filter((f) => f.stato === 'emessa' && !isNotaCredito(f)).map((f) => [f.id, situazione(f, incassi, fatture, oggi)])),
        [fatture, incassi, oggi]
    );
    const numeroDi = (id?: number) => (id ? fatture.find((x) => x.id === id)?.numero ?? undefined : undefined);

    const { stato, tipo, sdi } = list.filters;
    const result = useMemo(() => queryRows(fatture, {
        filters: [
            ...(stato === 'bozze' ? [(f: Fattura) => f.stato === 'bozza'] : stato === 'all' ? [] : [(f: Fattura) => situazioni.get(f.id)?.stato === stato]),
            ...(tipo === 'all' ? [] : [(f: Fattura) => f.tipo === tipo]),
            ...(sdi === 'all' ? [] : [(f: Fattura) => f.stato === 'emessa' && f.sdi === sdi]),
        ],
        search: list.search,
        searchFields: (f) => [f.numero ?? '', f.cliente.nome, f.cliente.piva, ...f.righe.map((r) => r.nome)],
        sort: {
            key: list.sortKey, dir: list.sortDir,
            value: (f, key) => key === 'totale' ? totaliFattura(f).totale : key === 'cliente' ? f.cliente.nome : key === 'scadenza' ? situazioni.get(f.id)?.scadenza ?? '' : key === 'numero' ? f.numero ?? '' : f.data,
        },
        page: { current: list.page, size: pageSize },
    }), [fatture, situazioni, stato, tipo, sdi, list.search, list.sortKey, list.sortDir, list.page, pageSize]);

    const daFatturare = useMemo(() => {
        const fatturati = ordiniGiaFatturati(fatture);
        return ordini.filter((o) => o.stato === 'consegnato' && !fatturati.has(o.id));
    }, [ordini, fatture]);

    function apriNuova(values: FatturaFormValues | null) {
        setInitial(values);
        dlg.openCreate();
    }

    function handleSubmit(values: FatturaFormValues) {
        if (dlg.editingId != null) updateMut.mutate({ id: dlg.editingId, data: values });
        else createMut.mutate(values);
        dlg.closeModal();
    }

    function emetti(f: Fattura) {
        confirm({
            title: 'Emettere il documento?',
            text: `Verrà assegnato il numero fiscale e ${TIPO_DOCUMENTO_LABEL[f.tipo].toLowerCase()} non sarà più modificabile.`,
            confirmLabel: 'Emetti',
            icon: 'fa-stamp',
            tone: 'accent',
            onConfirm: () => emettiMut.mutate(f.id),
        });
    }

    function handleExport() {
        exportCsv('fatture', result.filtered, [
            { header: 'Numero', value: (f) => f.numero ?? 'bozza' },
            { header: 'Tipo', value: (f) => f.tipo },
            { header: 'Data', value: (f) => f.data },
            { header: 'Cliente', value: (f) => f.cliente.nome },
            { header: 'P.IVA', value: (f) => f.cliente.piva },
            { header: 'Imponibile', value: (f) => totaliFattura(f).imponibile },
            { header: 'IVA', value: (f) => totaliFattura(f).iva },
            { header: 'Totale', value: (f) => totaliFattura(f).totale },
            { header: 'SDI', value: (f) => (f.stato === 'emessa' ? STATO_SDI_LABEL[f.sdi] : '') },
            { header: 'Scadenza', value: (f) => situazioni.get(f.id)?.scadenza ?? '' },
            { header: 'Residuo', value: (f) => situazioni.get(f.id)?.residuo ?? '' },
        ]);
        toast('Export CSV completato.', 'success');
    }

    const columns: Column<Fattura, SortKey>[] = [
        { id: 'numero', header: 'Numero', sortKey: 'numero', cell: (f) => <EntityCell icon={<i className={`fa-solid ${isNotaCredito(f) ? 'fa-file-circle-minus' : 'fa-file-invoice-dollar'}`} />} label={f.numero ?? 'Bozza'} onOpen={() => dlg.openDetail(f.id)} /> },
        { id: 'tipo', header: 'Tipo', cell: (f) => TIPO_DOCUMENTO_LABEL[f.tipo] },
        { id: 'data', header: 'Data', sortKey: 'data', cell: (f) => formatDate(f.data) },
        { id: 'cliente', header: 'Cliente', sortKey: 'cliente', cell: (f) => f.cliente.nome },
        { id: 'totale', header: 'Totale', sortKey: 'totale', className: 'cell-strong', cell: (f) => formatEuro((isNotaCredito(f) ? -1 : 1) * totaliFattura(f).totale) },
        {
            id: 'sdi', header: 'SDI',
            cell: (f) => f.stato === 'bozza'
                ? <span className="status-badge status-badge--bozza">Bozza</span>
                : <span className={`status-badge status-badge--${f.sdi}`}>{STATO_SDI_LABEL[f.sdi]}</span>,
        },
        {
            id: 'pagamento', header: 'Pagamento', sortKey: 'scadenza',
            cell: (f) => { const s = situazioni.get(f.id); return s ? <span className={`status-badge status-badge--${s.stato}`} title={`Scadenza ${formatDate(s.scadenza)}`}>{STATO_PAGAMENTO_LABEL[s.stato]}</span> : '—'; },
        },
    ];

    const rowActions: RowAction<Fattura>[] = [
        { id: 'view', icon: 'fa-eye', label: 'Dettaglio', onClick: (f) => dlg.openDetail(f.id) },
        { id: 'print', icon: 'fa-print', label: 'Stampa', onClick: (f) => setStampa(printableFattura(f, numeroDi(f.fatturaOrigineId))) },
        ...(perm.update ? [{ id: 'edit', icon: 'fa-pen', label: 'Modifica', onClick: (f: Fattura) => { setInitial(null); dlg.openEdit(f.id); }, disabled: (f: Fattura) => !fatturaModificabile(f) && 'Documento emesso' }] : []),
    ];

    const detail = dlg.detail;
    const detailSituazione = detail ? situazioni.get(detail.id) ?? null : null;

    const panelActions: PanelAction[] = detail ? [
        { id: 'print', label: 'Stampa', icon: 'fa-print', variant: 'outline', onClick: () => setStampa(printableFattura(detail, numeroDi(detail.fatturaOrigineId))) },
        ...(perm.update && fatturaModificabile(detail) ? [{ id: 'edit', label: 'Modifica', icon: 'fa-pen', variant: 'outline' as const, onClick: () => { setInitial(null); dlg.openEdit(detail.id); } }] : []),
        ...(perm.delete && fatturaModificabile(detail) ? [{ id: 'delete', label: 'Elimina', icon: 'fa-trash-can', variant: 'danger' as const, onClick: () => { dlg.closeDetail(); confirmDelete('la bozza', () => deleteMut.mutate(detail.id)); } }] : []),
    ] : [];

    const statoActions: StatoAction[] = detail ? [
        ...(perm.update && fatturaModificabile(detail) ? [{ id: 'emetti', label: 'Emetti', icon: 'fa-stamp', onClick: () => emetti(detail) }] : []),
        ...(canSdi && fatturaInviabile(detail) ? [{ id: 'sdi', label: detail.sdi === 'scartata' ? 'Reinvia allo SDI' : 'Invia allo SDI', icon: 'fa-paper-plane', onClick: () => sdiMut.mutate(detail.id) }] : []),
        ...(perm.update && detailSituazione && detailSituazione.residuo > 0 ? [{ id: 'incasso', label: 'Registra incasso', icon: 'fa-coins', onClick: () => setIncassoId(detail.id) }] : []),
        ...(perm.create && detail.stato === 'emessa' && !isNotaCredito(detail) && (detailSituazione?.residuo ?? 0) > 0
            ? [{ id: 'nc', label: 'Nota di credito', icon: 'fa-file-circle-minus', danger: true, onClick: () => { dlg.closeDetail(); apriNuova(notaCreditoDa(detail, oggi)); } }] : []),
    ] : [];

    // KPI
    const mese = oggi.slice(0, 7);
    const emesse = fatture.filter((f) => f.stato === 'emessa');
    const fatturatoMese = emesse.filter((f) => f.data.startsWith(mese)).reduce((s, f) => s + (isNotaCredito(f) ? -1 : 1) * totaliFattura(f).imponibile, 0);
    const daIncassare = [...situazioni.values()].reduce((s, x) => s + x.residuo, 0);
    const scaduto = [...situazioni.values()].filter((x) => x.stato === 'scaduta').reduce((s, x) => s + x.residuo, 0);
    const daSistemare = emesse.filter((f) => f.sdi === 'scartata' || f.sdi === 'da-inviare').length;
    const incassoTarget = incassoId != null ? fatture.find((f) => f.id === incassoId) : undefined;

    return (
        <AppLayout pageClass="app-page">
            <Topbar>
                <h1>Fatture</h1>
                <p>Fatturazione elettronica, note di credito e incassi</p>
            </Topbar>

            <KpiGrid stagger={stagger} items={[
                { icon: 'fa-euro-sign', variant: 'revenue', label: 'Fatturato del Mese', value: formatEuro(fatturatoMese, 0), trend: { dir: 'up', text: 'imponibile' } },
                { icon: 'fa-hourglass-half', variant: 'orders', label: 'Da Incassare', value: formatEuro(daIncassare, 0), trend: { dir: 'up', text: `${formatNumber([...situazioni.values()].filter((x) => x.residuo > 0).length)} documenti` } },
                { icon: 'fa-triangle-exclamation', variant: 'danger', label: 'Scaduto', value: formatEuro(scaduto, 0), trend: { dir: 'down', text: 'da sollecitare' } },
                { icon: 'fa-paper-plane', variant: 'warning', label: 'Da Inviare / Scartate', value: formatNumber(daSistemare), trend: { dir: 'down', text: 'SDI' } },
            ]} />

            <div style={stagger(4)}>
                <ListToolbar
                    search={list.search}
                    onSearchChange={list.setSearch}
                    searchPlaceholder="Cerca per numero, cliente, P.IVA o articolo..."
                    chips={{ label: 'Filtra per stato', value: stato, options: STATO_CHIPS, onChange: (v) => list.setFilter('stato', v) }}
                    onExport={perm.export ? handleExport : undefined}
                    onAdd={perm.create ? () => apriNuova(null) : undefined}
                    addLabel="Nuova Fattura"
                >
                    <ToolbarSelect label="Tipo documento" value={tipo} onChange={(v) => list.setFilter('tipo', v)}
                        options={[{ value: 'all', label: 'Tutti i tipi' }, ...(Object.keys(TIPO_DOCUMENTO_LABEL) as TipoDocumento[]).map((t) => ({ value: t, label: TIPO_DOCUMENTO_LABEL[t] }))]} />
                    <ToolbarSelect label="Stato SDI" value={sdi} onChange={(v) => list.setFilter('sdi', v)}
                        options={[{ value: 'all', label: 'Tutti gli stati SDI' }, ...(Object.keys(STATO_SDI_LABEL) as StatoSdi[]).map((t) => ({ value: t, label: STATO_SDI_LABEL[t] }))]} />
                    {perm.create && (
                        <ActionButton variant="outline" icon="fa-truck-ramp-box" onClick={() => setDaOrdiniOpen(true)}>
                            Da ordini{daFatturare.length ? ` (${daFatturare.length})` : ''}
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
                    rowLabel={(f) => `documento ${f.numero ?? 'bozza'}`}
                    rowClassName={(f) => (situazioni.get(f.id)?.stato === 'scaduta' || f.sdi === 'scartata' ? 'row--alert' : undefined)}
                    empty={{ icon: 'fa-file-invoice', text: 'Nessun documento trovato.' }}
                    pagination={{ total: result.filtered.length, page: result.page, totalPages: result.totalPages, pageSize, onPageChange: list.setPage }}
                />
            </div>

            <FatturaDetailPanel
                fattura={detail}
                situazione={detailSituazione}
                incassi={detail ? incassi.filter((i) => i.fatturaId === detail.id) : []}
                origine={numeroDi(detail?.fatturaOrigineId)}
                open={dlg.detailOpen}
                onClose={dlg.closeDetail}
                actions={panelActions}
                statoActions={statoActions}
                onEliminaIncasso={perm.update ? (id) => confirmDelete('l’incasso', () => eliminaIncassoMut.mutate(id)) : undefined}
                busy={emettiMut.isPending || sdiMut.isPending}
            />

            <FatturaModal
                open={dlg.modalOpen}
                onClose={dlg.closeModal}
                editing={dlg.editing}
                initial={initial}
                onSubmit={handleSubmit}
                saving={createMut.isPending || updateMut.isPending}
                clienti={clienti}
                prodotti={prodotti}
            />

            <DaOrdiniModal
                key={daOrdiniOpen ? 'open' : 'closed'}
                open={daOrdiniOpen}
                onClose={() => setDaOrdiniOpen(false)}
                ordini={daFatturare}
                onConfirm={(clienteId, scelti) => {
                    setDaOrdiniOpen(false);
                    apriNuova({
                        tipo: scelti.length > 1 ? 'TD24' : 'TD01',
                        clienteId,
                        data: oggi,
                        terminiPagamento: '30',
                        metodoPagamento: 'bonifico',
                        righe: righeDaOrdini(scelti),
                        note: `Rif. ordini ${scelti.map((o) => o.numero).join(', ')}`,
                        ordineIds: scelti.map((o) => o.id),
                    });
                }}
            />

            <IncassoModal
                key={incassoId ?? 'none'}
                target={incassoTarget ? { numero: incassoTarget.numero ?? '', residuo: situazioni.get(incassoTarget.id)?.residuo ?? 0, metodo: incassoTarget.metodoPagamento } : null}
                onClose={() => setIncassoId(null)}
                onSubmit={(v) => { if (incassoId != null) incassoMut.mutate({ fatturaId: incassoId, ...v }); setIncassoId(null); }}
            />

            <PrintPreview doc={stampa} onClose={() => setStampa(null)} />
        </AppLayout>
    );
}
