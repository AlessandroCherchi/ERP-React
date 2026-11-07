import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Topbar } from '../components/layout/Topbar';
import { DataTable, ToolbarSelect, type Column } from '../components/data';
import { RevenueChart } from '../components/charts/RevenueChart';
import { ActionButton } from '../components/ui/Button';
import { useStagger } from '../hooks/useStagger';
import { useAcquisti, useAudit, useFatture, useOrdini, useProdotti } from '../data';
import { useVisibleModules } from '../app/useModules';
import { etichettaMese, formatEuro, formatNumber, today } from '../lib/format';
import { exportCsv, type CsvColumn } from '../lib/csv';
import { acquistiPerFornitore, fatturatoMensile, magazzinoPerCategoria, topClienti, topProdotti } from '../lib/analytics';
import { statoProdotto, STATO_LABEL } from '../types/prodotto';
import type { AuditEntry } from '../types/audit';
import { useT } from '../i18n';
import '../styles/app-shell.css';
import '../styles/dashboard.css';
import '../styles/contabilita.css';

type Tab = 'vendite' | 'magazzino' | 'acquisti' | 'attivita';

/** Tabella di report con titolo ed export: le colonne servono a schermo e al CSV. */
function ReportTable<T extends { id: number | string }>({ title, rows, columns, csv, empty }: {
    title: string;
    rows: T[];
    columns: Column<T>[];
    csv: { base: string; columns: CsvColumn<T>[] };
    empty: string;
}) {
    return (
        <section className="report-block">
            <div className="report-block-head">
                <h2>{title}</h2>
                <ActionButton variant="outline" icon="fa-file-export" onClick={() => exportCsv(csv.base, rows, csv.columns)} disabled={rows.length === 0}>CSV</ActionButton>
            </div>
            <DataTable
                rows={rows}
                columns={columns}
                sortKey=""
                sortDir="asc"
                onSort={() => undefined}
                rowLabel={(r) => String(r.id)}
                empty={{ icon: 'fa-chart-simple', text: empty }}
                pagination={{ total: rows.length, page: 1, totalPages: 1, pageSize: Math.max(1, rows.length), onPageChange: () => undefined }}
            />
        </section>
    );
}

/**
 * Report: analisi su vendite, magazzino e acquisti, più il registro
 * attività. Ogni tabella è esportabile; i calcoli sono in lib/analytics.ts.
 */
export function Report() {
    const stagger = useStagger();
    const t = useT();
    const oggi = today();
    const [params, setParams] = useSearchParams();
    const tab = (params.get('tab') as Tab | null) ?? 'vendite';
    const [modulo, setModulo] = useState('all');
    const visibili = useVisibleModules();

    const { data: fatture = [] } = useFatture();
    const { data: ordini = [] } = useOrdini();
    const { data: prodotti = [] } = useProdotti();
    const { data: acquisti = [] } = useAcquisti();
    const { data: audit = [] } = useAudit();

    const serie = fatturatoMensile(fatture, 12, oggi);
    const totale12 = serie.reduce((s, x) => s + x.valore, 0);
    const clienti = topClienti(fatture, 10).map((c) => ({ ...c, id: c.clienteId }));
    const articoli = topProdotti(ordini, 10).map((p) => ({ ...p, id: p.prodottoId }));
    const categorie = magazzinoPerCategoria(prodotti).map((c) => ({ ...c, id: c.categoria }));
    const critici = prodotti.filter((p) => statoProdotto(p) !== 'disponibile');
    const fornitori = acquistiPerFornitore(acquisti).map((f) => ({ ...f, id: f.fornitore }));
    const attivita = audit.filter((a) => modulo === 'all' || a.modulo === modulo);

    const tabs: Array<[Tab, string]> = [['vendite', 'Vendite'], ['magazzino', 'Magazzino'], ['acquisti', 'Acquisti'], ['attivita', 'Registro attività']];

    return (
        <AppLayout pageClass="app-page">
            <Topbar>
                <h1>Report</h1>
                <p>Analisi di vendite, magazzino, acquisti e registro attività</p>
            </Topbar>

            <div className="filter-group page-tabs" role="tablist" style={stagger(0)}>
                {tabs.map(([id, label]) => (
                    <button key={id} type="button" role="tab" aria-selected={tab === id} className={`chip-btn${tab === id ? ' active' : ''}`} onClick={() => setParams({ tab: id }, { replace: true })}>{label}</button>
                ))}
            </div>

            <div style={stagger(1)}>
                {tab === 'vendite' && (
                    <>
                        <section className="neu-panel chart-panel report-chart">
                            <div className="panel-header">
                                <h2>Fatturato ultimi 12 mesi</h2>
                                <strong>{formatEuro(totale12, 0)}</strong>
                            </div>
                            <div className="chart-container">
                                <RevenueChart labels={serie.map((x) => etichettaMese(x.mese))} data={serie.map((x) => x.valore)} />
                            </div>
                        </section>
                        <div className="report-grid">
                            <ReportTable
                                title="Top clienti per fatturato"
                                rows={clienti}
                                empty="Nessuna fattura emessa."
                                columns={[
                                    { id: 'n', header: '#', cell: (c) => clienti.indexOf(c) + 1 },
                                    { id: 'nome', header: 'Cliente', cell: (c) => c.nome },
                                    { id: 'fatt', header: 'Fatturato', className: 'cell-strong', cell: (c) => formatEuro(c.fatturato, 0) },
                                ]}
                                csv={{ base: 'report_top_clienti', columns: [{ header: 'Cliente', value: (c) => c.nome }, { header: 'Fatturato', value: (c) => c.fatturato }] }}
                            />
                            <ReportTable
                                title="Articoli più venduti"
                                rows={articoli}
                                empty="Nessuna vendita."
                                columns={[
                                    { id: 'nome', header: 'Articolo', cell: (p) => p.nome },
                                    { id: 'q', header: 'Quantità', cell: (p) => formatNumber(p.quantita) },
                                    { id: 'r', header: 'Ricavo', className: 'cell-strong', cell: (p) => formatEuro(p.ricavo, 0) },
                                ]}
                                csv={{ base: 'report_top_articoli', columns: [{ header: 'SKU', value: (p) => p.sku }, { header: 'Articolo', value: (p) => p.nome }, { header: 'Quantità', value: (p) => p.quantita }, { header: 'Ricavo', value: (p) => p.ricavo }] }}
                            />
                        </div>
                    </>
                )}

                {tab === 'magazzino' && (
                    <div className="report-grid">
                        <ReportTable
                            title="Valorizzazione per categoria"
                            rows={categorie}
                            empty="Catalogo vuoto."
                            columns={[
                                { id: 'cat', header: 'Categoria', cell: (c) => c.categoria },
                                { id: 'art', header: 'Articoli', cell: (c) => formatNumber(c.articoli) },
                                { id: 'crit', header: 'Sotto scorta', cell: (c) => formatNumber(c.sottoScorta) },
                                { id: 'val', header: 'Valore', className: 'cell-strong', cell: (c) => formatEuro(c.valore, 0) },
                            ]}
                            csv={{ base: 'report_magazzino_categorie', columns: [{ header: 'Categoria', value: (c) => c.categoria }, { header: 'Articoli', value: (c) => c.articoli }, { header: 'Sotto scorta', value: (c) => c.sottoScorta }, { header: 'Valore', value: (c) => c.valore }] }}
                        />
                        <ReportTable
                            title="Articoli critici"
                            rows={critici}
                            empty="Nessun articolo sotto scorta."
                            columns={[
                                { id: 'sku', header: 'SKU', className: 'cell-sku', cell: (p) => p.sku },
                                { id: 'nome', header: 'Articolo', cell: (p) => p.nome },
                                { id: 'g', header: 'Giacenza / scorta', cell: (p) => `${formatNumber(p.giacenza)} / ${formatNumber(p.scorta)} ${p.unita}` },
                                { id: 's', header: 'Stato', cell: (p) => { const s = statoProdotto(p); return <span className={`status-badge status-badge--${s}`}>{STATO_LABEL[s]}</span>; } },
                            ]}
                            csv={{ base: 'report_articoli_critici', columns: [{ header: 'SKU', value: (p) => p.sku }, { header: 'Articolo', value: (p) => p.nome }, { header: 'Giacenza', value: (p) => p.giacenza }, { header: 'Scorta', value: (p) => p.scorta }, { header: 'Stato', value: (p) => STATO_LABEL[statoProdotto(p)] }] }}
                        />
                    </div>
                )}

                {tab === 'acquisti' && (
                    <ReportTable
                        title="Acquisti per fornitore (merce ricevuta)"
                        rows={fornitori}
                        empty="Nessun ordine d’acquisto."
                        columns={[
                            { id: 'f', header: 'Fornitore', cell: (f) => f.fornitore },
                            { id: 'o', header: 'Ordini', cell: (f) => formatNumber(f.ordini) },
                            { id: 'r', header: 'Ricevuto', className: 'cell-strong', cell: (f) => formatEuro(f.ricevuto, 0) },
                        ]}
                        csv={{ base: 'report_acquisti_fornitori', columns: [{ header: 'Fornitore', value: (f) => f.fornitore }, { header: 'Ordini', value: (f) => f.ordini }, { header: 'Ricevuto', value: (f) => f.ricevuto }] }}
                    />
                )}

                {tab === 'attivita' && (
                    <section className="report-block">
                        <div className="report-block-head">
                            <h2>Registro attività</h2>
                            <div className="report-actions">
                                <ToolbarSelect
                                    label="Filtra per modulo"
                                    value={modulo}
                                    onChange={setModulo}
                                    options={[{ value: 'all', label: 'Tutti i moduli' }, ...visibili.map((m) => ({ value: m.id, label: t(m.labelKey) }))]}
                                />
                                <ActionButton variant="outline" icon="fa-file-export" disabled={attivita.length === 0} onClick={() => exportCsv('registro_attivita', attivita, [
                                    { header: 'Data e ora', value: (a) => a.at },
                                    { header: 'Utente', value: (a) => a.userName },
                                    { header: 'Modulo', value: (a) => a.modulo },
                                    { header: 'Attività', value: (a) => a.text },
                                ])}>CSV</ActionButton>
                            </div>
                        </div>
                        <DataTable<AuditEntry, string>
                            rows={attivita}
                            columns={[
                                { id: 'at', header: 'Data e ora', cell: (a) => new Date(a.at).toLocaleString() },
                                { id: 'u', header: 'Utente', cell: (a) => a.userName },
                                { id: 'm', header: 'Modulo', cell: (a) => a.modulo },
                                { id: 'x', header: 'Attività', cell: (a) => <><i className={`fa-solid ${a.icon}`} aria-hidden="true" /> {a.text}</> },
                            ]}
                            sortKey=""
                            sortDir="desc"
                            onSort={() => undefined}
                            rowLabel={(a) => a.text}
                            empty={{ icon: 'fa-clock-rotate-left', text: 'Nessuna attività registrata in questo browser.' }}
                            pagination={{ total: attivita.length, page: 1, totalPages: 1, pageSize: Math.max(1, attivita.length), onPageChange: () => undefined }}
                        />
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
