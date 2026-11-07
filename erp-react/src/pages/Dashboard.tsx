import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Topbar } from '../components/layout/Topbar';
import { KpiValue } from '../components/ui/KpiValue';
import { RevenueChart } from '../components/charts/RevenueChart';
import { DonutChart } from '../components/charts/DonutChart';
import { useToast } from '../components/ui/Toast';
import { useConfirm } from '../components/ui/Confirm';
import { useStagger } from '../hooks/useStagger';
import { ClientModal } from '../components/clienti/ClientModal';
import { OrdineModal } from '../components/vendite/OrdineModal';
import { FatturaModal } from '../components/dashboard/modals/FatturaModal';
import { ProdottoModal } from '../components/inventario/ProdottoModal';
import { ReportModal } from '../components/dashboard/modals/ReportModal';
import {
    useClienti, useClientiSelezionabili, useCreateCliente, useCreateOrdine, useCreateProdotto,
    useFornitoriNomi, useOrdini, useProdotti,
} from '../data';
import { useCan } from '../auth/hooks';
import { useSession } from '../auth/session';
import { useConfig, isModuleEnabled } from '../config/configStore';
import { formatNumber as formatCode, nextNumber } from '../config/numbering';
import { useT, type TFunction } from '../i18n';
import { downloadCsv, downloadJson, formatEuro, today } from '../lib/format';
import { DONUT_SEGMENTS, INITIAL_ACTIVITIES, PRODUCTS, REVENUE_DATA, REVENUE_LABELS, type Activity } from '../lib/demoData/dashboard';
import { totaliOrdine, type OrdineFormValues } from '../types/ordine';
import type { ClienteFormValues } from '../types/cliente';
import type { FatturaForm, ProdottoForm, ReportForm } from '../types/quickActions';
import '../styles/app-shell.css';
import '../styles/dashboard.css';

const KPI = {
    revenue: '€ 124.850',
    orders: '38',
    clients: '16',
    stock: '1.247',
};

const REPORT_LABELS: Record<string, string> = {
    fatturato: 'Andamento fatturato',
    prodotti: 'Top prodotti del mese',
    attivita: 'Registro attività',
    kpi: 'Riepilogo KPI',
};

function greeting(t: TFunction, name: string, intl: string): { title: string; date: string } {
    const h = new Date().getHours();
    const saluto = t(h >= 18 ? 'greeting.evening' : h >= 13 ? 'greeting.afternoon' : 'greeting.morning');
    const date = new Date().toLocaleDateString(intl, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return { title: `${saluto}, ${name.split(' ')[0]}`, date };
}

export function Dashboard() {
    const { toast } = useToast();
    const { confirm } = useConfirm();
    const staggerStyle = useStagger();
    const t = useT();
    const config = useConfig();
    const session = useSession();
    const can = useCan();
    const { title: greetTitle, date: greetDate } = greeting(t, session?.user.name ?? '', config.locale.intl);

    // Azioni rapide visibili solo se modulo attivo e ruolo autorizzato (§5).
    const show = {
        ordine: isModuleEnabled(config, 'vendite') && can('ordini', 'create'),
        fattura: isModuleEnabled(config, 'fatture') && can('fatture', 'create'),
        cliente: isModuleEnabled(config, 'clienti') && can('anagrafiche', 'create'),
        prodotto: isModuleEnabled(config, 'inventario') && can('magazzino', 'create'),
        report: can('ordini', 'export'),
        backup: can('impostazioni', 'update'),
    };

    const { data: clienti = [] } = useClienti();
    const clientiNomi = useMemo(() => clienti.map((c) => c.nome), [clienti]);

    // Catalogo condiviso con la pagina Inventario: serve per suggerire
    // uno SKU che non collida con quelli già assegnati.
    const { data: prodotti = [] } = useProdotti();
    const { data: fornitoriNomi = [] } = useFornitoriNomi();
    const nextSku = useMemo(() => nextNumber(config.numbering.sku, prodotti.map((p) => p.sku)), [config.numbering.sku, prodotti]);

    // Registro ordini condiviso con la pagina Vendite: la quick action crea
    // un documento vero, non un evento della sola dashboard. Il numero
    // proposto è derivato dai dati per la stessa ragione dello SKU — due
    // contatori indipendenti assegnerebbero lo stesso numero.
    const { data: ordini = [] } = useOrdini();
    const { data: clientiRef = [] } = useClientiSelezionabili();
    const nextNumeroOrdine = useMemo(() => nextNumber(config.numbering.ordine, ordini.map((o) => o.numero)), [config.numbering.ordine, ordini]);

    const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);
    const [counters, setCounters] = useState({ fattura: 142 });
    const [chartRange, setChartRange] = useState<'7d' | '30d' | '12m'>('7d');

    const [ordineOpen, setOrdineOpen] = useState(false);
    const [fatturaOpen, setFatturaOpen] = useState(false);
    const [clienteOpen, setClienteOpen] = useState(false);
    const [prodottoOpen, setProdottoOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);

    function pushActivity(icon: string, title: string, desc: string) {
        setActivities((prev) => [{ id: Date.now(), icon, title, desc, time: 'Adesso' }, ...prev].slice(0, 6));
    }

    const createClienteMut = useCreateCliente({
        onSuccess: (c) => {
            pushActivity('fa-user-plus', 'Nuovo cliente registrato', c.nome + (c.citta ? ` — ${c.citta}` : ''));
            toast(`Cliente "${c.nome}" creato con successo.`, 'success');
        },
    });

    // La quick action scrive nello stesso catalogo della pagina Inventario:
    // l'articolo creato qui compare subito lì (stesso pattern del cliente).
    const createProdottoMut = useCreateProdotto({
        onSuccess: (p) => {
            pushActivity('fa-box', 'Nuovo prodotto a catalogo', `${p.nome} (${p.sku})`);
            toast(`Prodotto "${p.nome}" salvato con successo.`, 'success');
        },
    });

    const createOrdineMut = useCreateOrdine({
        onSuccess: (o) => {
            const tot = totaliOrdine(o.righe);
            pushActivity('fa-cart-shopping', `Nuovo ordine ${o.numero}`, `${o.cliente} — ${tot.pezzi} pezzi, ${formatEuro(tot.totale, 0)}`);
            toast(`Ordine "${o.numero}" creato in bozza.`, 'success');
        },
    });

    function handleSaveOrdine(v: OrdineFormValues) {
        createOrdineMut.mutate(v);
        setOrdineOpen(false);
    }

    function handleSaveFattura(v: FatturaForm) {
        setCounters((c) => ({ ...c, fattura: c.fattura + 1 }));
        pushActivity('fa-file-invoice-dollar', `Fattura ${v.numero} emessa`, `Cliente: ${v.cliente}`);
        setFatturaOpen(false);
        toast(`Fattura "${v.numero}" emessa con successo.`, 'success');
    }

    function handleSaveCliente(v: ClienteFormValues) {
        createClienteMut.mutate(v);
        setClienteOpen(false);
    }

    function handleSaveProdotto(v: ProdottoForm) {
        createProdottoMut.mutate(v);
        setProdottoOpen(false);
    }

    function buildReportRows(tipo: string): { headers: string[]; rows: unknown[][] } {
        switch (tipo) {
            case 'fatturato':
                return { headers: ['Mese', 'Fatturato (k€)'], rows: REVENUE_LABELS.map((m, i) => [m, REVENUE_DATA[i]]) };
            case 'prodotti':
                return { headers: ['#', 'Prodotto', 'Categoria', 'Venduti', 'Ricavo', 'Trend'], rows: PRODUCTS.map((p) => [p.rank, p.name, p.cat, p.sold, p.revenue, p.pct]) };
            case 'attivita':
                return { headers: ['Titolo', 'Dettaglio', 'Quando'], rows: activities.map((a) => [a.title, a.desc, a.time]) };
            default:
                return {
                    headers: ['Indicatore', 'Valore'],
                    rows: [
                        ['Fatturato Mensile', KPI.revenue],
                        ['Ordini Aperti', KPI.orders],
                        ['Nuovi Clienti', KPI.clients],
                        ['Articoli in Stock', KPI.stock],
                    ],
                };
        }
    }

    function handleSaveReport(v: ReportForm) {
        const report = buildReportRows(v.tipo);
        const stamp = today();
        const basename = `report_${v.tipo}_${stamp}`;

        if (v.formato === 'json') {
            downloadJson(`${basename}.json`, {
                report: REPORT_LABELS[v.tipo],
                periodo: v.periodo,
                generato: stamp,
                colonne: report.headers,
                righe: report.rows,
            });
        } else {
            downloadCsv(`${basename}.csv`, report.headers, report.rows);
        }

        pushActivity('fa-download', 'Report generato', REPORT_LABELS[v.tipo] ?? v.tipo);
        setReportOpen(false);
        toast(`Report "${REPORT_LABELS[v.tipo]}" scaricato con successo.`, 'success');
    }

    function handleBackup() {
        confirm({
            title: 'Avviare il backup?',
            text: "Verrà creata una copia completa dei dati dell'ERP. L'operazione può richiedere alcuni minuti.",
            confirmLabel: 'Avvia Backup',
            icon: 'fa-database',
            tone: 'accent',
            onConfirm: () => {
                toast('Backup avviato in background…', 'info');
                setTimeout(() => {
                    pushActivity('fa-database', 'Backup completato', 'Copia di sicurezza salvata correttamente.');
                    toast('Backup completato con successo.', 'success');
                }, 1400);
            },
        });
    }

    return (
        <AppLayout pageClass="dashboard-page">
            <Topbar>
                <h1>{greetTitle}</h1>
                <p>{greetDate}</p>
            </Topbar>

            <section className="kpi-grid">
                <div className="kpi-card" style={staggerStyle(0)}>
                    <div className="kpi-icon kpi-icon--revenue"><i className="fa-solid fa-euro-sign" /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">Fatturato Mensile</span>
                        <KpiValue value={KPI.revenue} />
                        <span className="kpi-trend kpi-trend--up"><i className="fa-solid fa-arrow-trend-up" /> +12.4%</span>
                    </div>
                </div>
                <div className="kpi-card" style={staggerStyle(1)}>
                    <div className="kpi-icon kpi-icon--orders"><i className="fa-solid fa-cart-shopping" /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">Ordini Aperti</span>
                        <KpiValue value={KPI.orders} />
                        <span className="kpi-trend kpi-trend--up"><i className="fa-solid fa-arrow-trend-up" /> +5.2%</span>
                    </div>
                </div>
                <div className="kpi-card" style={staggerStyle(2)}>
                    <div className="kpi-icon kpi-icon--clients"><i className="fa-solid fa-user-group" /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">Nuovi Clienti</span>
                        <KpiValue value={KPI.clients} />
                        <span className="kpi-trend kpi-trend--up"><i className="fa-solid fa-arrow-trend-up" /> +8.1%</span>
                    </div>
                </div>
                <div className="kpi-card" style={staggerStyle(3)}>
                    <div className="kpi-icon kpi-icon--stock"><i className="fa-solid fa-warehouse" /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">Articoli in Stock</span>
                        <KpiValue value={KPI.stock} />
                        <span className="kpi-trend kpi-trend--down"><i className="fa-solid fa-arrow-trend-down" /> -2.3%</span>
                    </div>
                </div>
            </section>

            <section className="dashboard-row">
                <div className="neu-panel chart-panel" style={staggerStyle(4)}>
                    <div className="panel-header">
                        <h2>Andamento Fatturato</h2>
                        <div className="panel-actions">
                            {(['7d', '30d', '12m'] as const).map((r) => (
                                <button key={r} className={`chip-btn${chartRange === r ? ' active' : ''}`} onClick={() => setChartRange(r)}>
                                    {r === '7d' ? '7G' : r === '30d' ? '30G' : '12M'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="chart-container">
                        <RevenueChart labels={REVENUE_LABELS} data={REVENUE_DATA} />
                    </div>
                </div>

                <div className="neu-panel chart-panel chart-panel--small" style={staggerStyle(5)}>
                    <div className="panel-header"><h2>Ordini per Stato</h2></div>
                    <div className="chart-container chart-container--donut">
                        <DonutChart segments={DONUT_SEGMENTS} />
                    </div>
                    <div className="donut-legend">
                        <div className="legend-item"><span className="dot dot--completed" />Completati</div>
                        <div className="legend-item"><span className="dot dot--pending" />In Attesa</div>
                        <div className="legend-item"><span className="dot dot--cancelled" />Annullati</div>
                    </div>
                </div>
            </section>

            <section className="dashboard-row">
                <div className="neu-panel activities-panel" style={staggerStyle(6)}>
                    <div className="panel-header">
                        <h2>Attività Recenti</h2>
                        <a href="#!" className="panel-link" onClick={(e) => e.preventDefault()}>Vedi tutto <i className="fa-solid fa-arrow-right" /></a>
                    </div>
                    <ul className="activity-list">
                        {activities.map((a) => (
                            <li className="activity-item" key={a.id}>
                                <div className="activity-icon"><i className={`fa-solid ${a.icon}`} /></div>
                                <div className="activity-text"><strong>{a.title}</strong><span>{a.desc}</span></div>
                                <div className="activity-time">{a.time}</div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="neu-panel quick-panel" style={staggerStyle(7)}>
                    <div className="panel-header"><h2>Azioni Rapide</h2></div>
                    <div className="quick-grid">
                        {show.ordine && (
                            <button className="quick-btn" onClick={() => setOrdineOpen(true)}>
                                <div className="quick-btn-icon"><i className="fa-solid fa-plus" /></div>
                                <span>Nuovo Ordine</span>
                            </button>
                        )}
                        {show.fattura && (
                            <button className="quick-btn" onClick={() => setFatturaOpen(true)}>
                                <div className="quick-btn-icon"><i className="fa-solid fa-file-invoice" /></div>
                                <span>Nuova Fattura</span>
                            </button>
                        )}
                        {show.cliente && (
                            <button className="quick-btn" onClick={() => setClienteOpen(true)}>
                                <div className="quick-btn-icon"><i className="fa-solid fa-user-plus" /></div>
                                <span>Aggiungi Cliente</span>
                            </button>
                        )}
                        {show.prodotto && (
                            <button className="quick-btn" onClick={() => setProdottoOpen(true)}>
                                <div className="quick-btn-icon"><i className="fa-solid fa-box" /></div>
                                <span>Aggiungi Prodotto</span>
                            </button>
                        )}
                        {show.report && (
                            <button className="quick-btn" onClick={() => setReportOpen(true)}>
                                <div className="quick-btn-icon"><i className="fa-solid fa-download" /></div>
                                <span>Scarica Report</span>
                            </button>
                        )}
                        {show.backup && (
                            <button className="quick-btn" onClick={handleBackup}>
                                <div className="quick-btn-icon"><i className="fa-solid fa-database" /></div>
                                <span>Backup Dati</span>
                            </button>
                        )}
                    </div>
                </div>
            </section>

            <section className="dashboard-row">
                <div className="neu-panel table-panel" style={staggerStyle(8)}>
                    <div className="panel-header">
                        <h2>Top Prodotti del Mese</h2>
                        <Link to="/inventario" className="panel-link">Catalogo <i className="fa-solid fa-arrow-right" /></Link>
                    </div>
                    <div className="table-wrapper">
                        <table className="neu-table">
                            <thead>
                                <tr><th>#</th><th>Prodotto</th><th>Categoria</th><th>Venduti</th><th>Ricavo</th><th>Trend</th></tr>
                            </thead>
                            <tbody>
                                {PRODUCTS.map((p) => (
                                    <tr key={p.rank}>
                                        <td>{p.rank}</td>
                                        <td style={{ fontWeight: 600, color: 'var(--erp-text)' }}>{p.name}</td>
                                        <td>{p.cat}</td>
                                        <td>{p.sold.toLocaleString('it-IT')}</td>
                                        <td style={{ fontWeight: 600 }}>{p.revenue}</td>
                                        <td>
                                            <span className={`table-trend ${p.up ? 'table-trend--up' : 'table-trend--down'}`}>
                                                <i className={`fa-solid ${p.up ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`} /> {p.pct}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <OrdineModal
                open={ordineOpen}
                onClose={() => setOrdineOpen(false)}
                editing={null}
                onSubmit={handleSaveOrdine}
                saving={createOrdineMut.isPending}
                clienti={clientiRef}
                prodotti={prodotti}
                numeroSuggerito={nextNumeroOrdine}
            />
            <FatturaModal
                open={fatturaOpen}
                onClose={() => setFatturaOpen(false)}
                onSubmit={handleSaveFattura}
                defaults={{ numero: `${new Date().getFullYear()}/${formatCode(config.numbering.fattura, counters.fattura + 1)}`, data: today() }}
                clientiNomi={clientiNomi}
            />
            <ClientModal
                open={clienteOpen}
                onClose={() => setClienteOpen(false)}
                editing={null}
                onSubmit={handleSaveCliente}
                saving={createClienteMut.isPending}
            />
            <ProdottoModal
                open={prodottoOpen}
                onClose={() => setProdottoOpen(false)}
                onSubmit={handleSaveProdotto}
                defaults={{ sku: nextSku }}
                fornitori={fornitoriNomi}
            />
            <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} onSubmit={handleSaveReport} />
        </AppLayout>
    );
}
