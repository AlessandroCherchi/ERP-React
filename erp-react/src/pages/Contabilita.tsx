import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Topbar } from '../components/layout/Topbar';
import { DataTable, KpiGrid, ListToolbar, type Column, type RowAction } from '../components/data';
import { IncassoModal } from '../components/fatture/IncassoModal';
import { useToast } from '../components/ui/toastContext';
import { useStagger } from '../hooks/useStagger';
import { useFatture, useIncassi, useRegistraIncasso } from '../data';
import { usePermissions } from '../auth/hooks';
import { useConfig } from '../config/configStore';
import { formatDate, formatEuro, formatNumber, today } from '../lib/format';
import { exportCsv } from '../lib/csv';
import { queryRows } from '../lib/listQuery';
import {
    FASCIA_LABEL, fasciaAging, giorniTra, isNotaCredito, registroIvaVendite, situazione, STATO_PAGAMENTO_LABEL,
    type FasciaAging, type Fattura, type Incasso, type RigaRegistroIva, type Situazione,
} from '../types/fattura';
import '../styles/app-shell.css';
import '../styles/documenti.css';
import '../styles/contabilita.css';

type Tab = 'scadenzario' | 'incassi' | 'iva';
interface Partita { id: number; fattura: Fattura; s: Situazione; fascia: FasciaAging; ritardo: number }

const FASCE: FasciaAging[] = ['a-scadere', '0-30', '31-60', '61-90', 'oltre-90'];

/**
 * Contabilità operativa: scadenzario crediti con anzianità (aging), prima
 * nota incassi e registro IVA vendite. Non sostituisce la contabilità
 * generale: è la vista gestionale che serve a magazzino e amministrazione.
 */
export function Contabilita() {
    const { toast } = useToast();
    const stagger = useStagger();
    const oggi = today();
    const perm = usePermissions('fatture');
    const { pageSize } = useConfig();
    const [params, setParams] = useSearchParams();
    const tab = (params.get('tab') as Tab | null) ?? 'scadenzario';

    const { data: fatture = [] } = useFatture();
    const { data: incassi = [] } = useIncassi();
    const incassoMut = useRegistraIncasso({ onSuccess: (i) => toast(`Incasso di ${formatEuro(i.importo)} registrato.`, 'success'), onError: (e) => toast(e.message, 'error') });

    const [search, setSearch] = useState('');
    const [fascia, setFascia] = useState<'all' | FasciaAging>('all');
    const [page, setPage] = useState(1);
    const [incassoId, setIncassoId] = useState<number | null>(null);

    /** Partite aperte: fatture emesse con residuo da incassare. */
    const partite = useMemo<Partita[]>(() => fatture
        .filter((f) => f.stato === 'emessa' && !isNotaCredito(f))
        .map((f) => {
            const s = situazione(f, incassi, fatture, oggi);
            return { id: f.id, fattura: f, s, fascia: fasciaAging(s.scadenza, oggi), ritardo: Math.max(0, giorniTra(s.scadenza, oggi)) };
        })
        .filter((p) => p.s.residuo > 0), [fatture, incassi, oggi]);

    const perFascia = useMemo(() => {
        const m = new Map<FasciaAging, number>(FASCE.map((f) => [f, 0]));
        for (const p of partite) m.set(p.fascia, (m.get(p.fascia) ?? 0) + p.s.residuo);
        return m;
    }, [partite]);

    const totaleCrediti = partite.reduce((s, p) => s + p.s.residuo, 0);
    const scaduto = partite.filter((p) => p.ritardo > 0).reduce((s, p) => s + p.s.residuo, 0);
    // DSO semplificato: ritardo medio ponderato sul residuo scaduto.
    const ritardoMedio = scaduto ? Math.round(partite.reduce((s, p) => s + p.ritardo * p.s.residuo, 0) / scaduto) : 0;
    const incassatoMese = incassi.filter((i) => i.data.startsWith(oggi.slice(0, 7))).reduce((s, i) => s + i.importo, 0);

    const scadResult = useMemo(() => queryRows(partite, {
        filters: fascia === 'all' ? [] : [(p) => p.fascia === fascia],
        search,
        searchFields: (p) => [p.fattura.numero ?? '', p.fattura.cliente.nome],
        sort: { key: 'scadenza' as const, dir: 'asc', value: (p) => p.s.scadenza },
        page: { current: page, size: pageSize },
    }), [partite, fascia, search, page, pageSize]);

    const numero = (fatturaId: number) => fatture.find((f) => f.id === fatturaId)?.numero ?? '—';
    const clienteDi = (fatturaId: number) => fatture.find((f) => f.id === fatturaId)?.cliente.nome ?? '—';
    const incassiOrdinati = useMemo(() => [...incassi].sort((a, b) => b.data.localeCompare(a.data)), [incassi]);
    const registro = useMemo(() => registroIvaVendite(fatture), [fatture]);

    const colsScad: Column<Partita, 'scadenza'>[] = [
        { id: 'numero', header: 'Fattura', cell: (p) => p.fattura.numero },
        { id: 'cliente', header: 'Cliente', cell: (p) => p.fattura.cliente.nome },
        { id: 'scadenza', header: 'Scadenza', sortKey: 'scadenza', cell: (p) => formatDate(p.s.scadenza) },
        { id: 'ritardo', header: 'Ritardo', cell: (p) => (p.ritardo ? `${p.ritardo} gg` : '—') },
        { id: 'totale', header: 'Totale', cell: (p) => formatEuro(p.s.totale) },
        { id: 'residuo', header: 'Residuo', className: 'cell-strong', cell: (p) => formatEuro(p.s.residuo) },
        { id: 'stato', header: 'Stato', cell: (p) => <span className={`status-badge status-badge--${p.s.stato}`}>{STATO_PAGAMENTO_LABEL[p.s.stato]}</span> },
    ];
    const actionsScad: RowAction<Partita>[] = perm.update ? [{ id: 'incasso', icon: 'fa-coins', label: 'Registra incasso', onClick: (p) => setIncassoId(p.id) }] : [];

    const colsIncassi: Column<Incasso, 'data'>[] = [
        { id: 'data', header: 'Data', sortKey: 'data', cell: (i) => formatDate(i.data) },
        { id: 'fattura', header: 'Fattura', cell: (i) => numero(i.fatturaId) },
        { id: 'cliente', header: 'Cliente', cell: (i) => clienteDi(i.fatturaId) },
        { id: 'metodo', header: 'Metodo', cell: (i) => i.metodo },
        { id: 'note', header: 'Note', cell: (i) => i.note || '—' },
        { id: 'importo', header: 'Importo', className: 'cell-strong', cell: (i) => formatEuro(i.importo) },
    ];

    const colsIva: Column<RigaRegistroIva & { id: string }, 'periodo'>[] = [
        { id: 'periodo', header: 'Periodo', cell: (r) => new Date(`${r.periodo}-01T00:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) },
        { id: 'aliquota', header: 'Aliquota', cell: (r) => `${r.aliquota}%` },
        { id: 'imponibile', header: 'Imponibile', cell: (r) => formatEuro(r.imponibile) },
        { id: 'imposta', header: 'IVA a debito', className: 'cell-strong', cell: (r) => formatEuro(r.imposta) },
    ];

    const target = partite.find((p) => p.id === incassoId);

    return (
        <AppLayout pageClass="app-page">
            <Topbar>
                <h1>Contabilità</h1>
                <p>Scadenzario crediti, incassi e registro IVA vendite</p>
            </Topbar>

            <KpiGrid stagger={stagger} items={[
                { icon: 'fa-hand-holding-dollar', variant: 'revenue', label: 'Crediti Aperti', value: formatEuro(totaleCrediti, 0), trend: { dir: 'up', text: `${formatNumber(partite.length)} partite` } },
                { icon: 'fa-triangle-exclamation', variant: 'danger', label: 'Scaduto', value: formatEuro(scaduto, 0), trend: { dir: 'down', text: totaleCrediti ? `${Math.round((scaduto / totaleCrediti) * 100)}% dei crediti` : '—' } },
                { icon: 'fa-clock', variant: 'warning', label: 'Ritardo Medio', value: `${ritardoMedio} gg`, trend: { dir: 'down', text: 'ponderato sullo scaduto' } },
                { icon: 'fa-coins', variant: 'active', label: 'Incassato nel Mese', value: formatEuro(incassatoMese, 0), trend: { dir: 'up', text: 'prima nota' } },
            ]} />

            <div className="filter-group page-tabs" role="tablist" style={stagger(4)}>
                {([['scadenzario', 'Scadenzario'], ['incassi', 'Incassi'], ['iva', 'Registro IVA vendite']] as const).map(([id, label]) => (
                    <button key={id} type="button" role="tab" aria-selected={tab === id} className={`chip-btn${tab === id ? ' active' : ''}`} onClick={() => setParams({ tab: id }, { replace: true })}>{label}</button>
                ))}
            </div>

            {tab === 'scadenzario' && (
                <div style={stagger(5)}>
                    <section className="neu-panel aging-panel" aria-label="Anzianità dei crediti">
                        {FASCE.map((f) => {
                            const v = perFascia.get(f) ?? 0;
                            return (
                                <button key={f} type="button" className={`aging-bucket aging-bucket--${f}${fascia === f ? ' active' : ''}`} aria-pressed={fascia === f} onClick={() => { setFascia(fascia === f ? 'all' : f); setPage(1); }}>
                                    <span>{FASCIA_LABEL[f]}</span>
                                    <strong>{formatEuro(v, 0)}</strong>
                                    <span className="aging-bar"><span style={{ width: `${totaleCrediti ? (v / totaleCrediti) * 100 : 0}%` }} /></span>
                                </button>
                            );
                        })}
                    </section>
                    <ListToolbar
                        search={search}
                        onSearchChange={(v) => { setSearch(v); setPage(1); }}
                        searchPlaceholder="Cerca per fattura o cliente..."
                        onExport={() => exportCsv('scadenzario', scadResult.filtered, [
                            { header: 'Fattura', value: (p) => p.fattura.numero },
                            { header: 'Cliente', value: (p) => p.fattura.cliente.nome },
                            { header: 'Scadenza', value: (p) => p.s.scadenza },
                            { header: 'Ritardo (gg)', value: (p) => p.ritardo },
                            { header: 'Fascia', value: (p) => FASCIA_LABEL[p.fascia] },
                            { header: 'Totale', value: (p) => p.s.totale },
                            { header: 'Residuo', value: (p) => p.s.residuo },
                        ])}
                    />
                    <DataTable
                        rows={scadResult.rows}
                        columns={colsScad}
                        sortKey="scadenza"
                        sortDir="asc"
                        onSort={() => undefined}
                        actions={actionsScad}
                        rowLabel={(p) => `fattura ${p.fattura.numero}`}
                        rowClassName={(p) => (p.ritardo > 60 ? 'row--alert' : undefined)}
                        empty={{ icon: 'fa-circle-check', text: 'Nessun credito aperto.' }}
                        pagination={{ total: scadResult.filtered.length, page: scadResult.page, totalPages: scadResult.totalPages, pageSize, onPageChange: setPage }}
                    />
                </div>
            )}

            {tab === 'incassi' && (
                <div style={stagger(5)}>
                    <DataTable
                        rows={incassiOrdinati}
                        columns={colsIncassi}
                        sortKey="data"
                        sortDir="desc"
                        onSort={() => undefined}
                        rowLabel={(i) => `incasso ${formatDate(i.data)}`}
                        empty={{ icon: 'fa-coins', text: 'Nessun incasso registrato.' }}
                        pagination={{ total: incassiOrdinati.length, page: 1, totalPages: 1, pageSize: Math.max(1, incassiOrdinati.length), onPageChange: () => undefined }}
                    />
                </div>
            )}

            {tab === 'iva' && (
                <div style={stagger(5)}>
                    <p className="page-note"><i className="fa-solid fa-circle-info" /> Riepilogo indicativo dai documenti emessi (note di credito a sottrarre). La liquidazione periodica ufficiale è calcolata dal backend fiscale.</p>
                    <DataTable
                        rows={registro.map((r) => ({ ...r, id: `${r.periodo}-${r.aliquota}` }))}
                        columns={colsIva}
                        sortKey="periodo"
                        sortDir="desc"
                        onSort={() => undefined}
                        rowLabel={(r) => `${r.periodo} ${r.aliquota}%`}
                        empty={{ icon: 'fa-receipt', text: 'Nessun documento emesso.' }}
                        pagination={{ total: registro.length, page: 1, totalPages: 1, pageSize: Math.max(1, registro.length), onPageChange: () => undefined }}
                    />
                </div>
            )}

            <IncassoModal
                key={incassoId ?? 'none'}
                target={target ? { numero: target.fattura.numero ?? '', residuo: target.s.residuo, metodo: target.fattura.metodoPagamento } : null}
                onClose={() => setIncassoId(null)}
                onSubmit={(v) => { if (incassoId != null) incassoMut.mutate({ fatturaId: incassoId, ...v }); setIncassoId(null); }}
            />
        </AppLayout>
    );
}
