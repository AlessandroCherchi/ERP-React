import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Topbar } from '../components/layout/Topbar';
import { KpiGrid } from '../components/data';
import { RevenueChart } from '../components/charts/RevenueChart';
import { DonutChart } from '../components/charts/DonutChart';
import { ClientModal } from '../components/clienti/ClientModal';
import { OrdineModal } from '../components/vendite/OrdineModal';
import { FatturaModal } from '../components/fatture/FatturaModal';
import { ProdottoModal } from '../components/inventario/ProdottoModal';
import { useToast } from '../components/ui/toastContext';
import { useStagger } from '../hooks/useStagger';
import { useNotifiche } from '../hooks/useNotifiche';
import {
    useAudit, useClientiSelezionabili, useCreateCliente, useCreateFattura, useCreateOrdine, useCreateProdotto,
    useFatture, useFornitoriRef, useIncassi, useOrdini, useProdotti,
} from '../data';
import { useCan } from '../auth/hooks';
import { useSession } from '../auth/session';
import { useConfig, isModuleEnabled } from '../config/configStore';
import { nextNumber } from '../config/numbering';
import { etichettaMese, formatEuro, formatNumber, tempoFa, today } from '../lib/format';
import { creditiScaduti, fatturatoMensile, ordiniPerStato, topProdotti } from '../lib/analytics';
import { isNotaCredito, totaliFattura } from '../types/fattura';
import { ordineAperto } from '../types/ordine';
import { valoreGiacenza } from '../types/prodotto';
import type { ClienteFormValues } from '../types/cliente';
import { useT, type TFunction } from '../i18n';
import '../styles/app-shell.css';
import '../styles/dashboard.css';

function greeting(t: TFunction, name: string, intl: string): { title: string; date: string } {
    const h = new Date().getHours();
    const saluto = t(h >= 18 ? 'greeting.evening' : h >= 13 ? 'greeting.afternoon' : 'greeting.morning');
    const date = new Date().toLocaleDateString(intl, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return { title: `${saluto}, ${name.split(' ')[0]}`, date };
}

type Modale = 'ordine' | 'fattura' | 'cliente' | 'prodotto' | null;

/**
 * Cruscotto: tutti i numeri sono derivati dai dati reali (fatture, ordini,
 * magazzino, incassi, registro attività). Azioni rapide e avvisi seguono
 * moduli attivi e permessi del ruolo.
 */
export function Dashboard() {
    const { toast } = useToast();
    const stagger = useStagger();
    const navigate = useNavigate();
    const t = useT();
    const config = useConfig();
    const session = useSession();
    const can = useCan();
    const oggi = today();
    const { title: greetTitle, date: greetDate } = greeting(t, session?.user.name ?? '', config.locale.intl);
    const [modale, setModale] = useState<Modale>(null);
    const [mesi, setMesi] = useState<6 | 12>(12);

    const { data: ordini = [] } = useOrdini();
    const { data: prodotti = [] } = useProdotti();
    const { data: fatture = [] } = useFatture();
    const { data: incassi = [] } = useIncassi();
    const { data: clientiRef = [] } = useClientiSelezionabili();
    const { data: fornitori = [] } = useFornitoriRef();
    const { data: audit = [] } = useAudit();
    const notifiche = useNotifiche();

    const attivo = (id: Parameters<typeof isModuleEnabled>[1]) => isModuleEnabled(config, id);
    const show = {
        ordine: attivo('vendite') && can('ordini', 'create'),
        fattura: attivo('fatture') && can('fatture', 'create'),
        cliente: attivo('clienti') && can('anagrafiche', 'create'),
        prodotto: attivo('inventario') && can('magazzino', 'create'),
        riordino: attivo('acquisti') && can('ordini', 'create'),
        report: attivo('report') && can('ordini', 'read'),
    };

    const onError = (e: Error) => toast(e.message, 'error');
    const createCliente = useCreateCliente({ onSuccess: (c) => toast(`Cliente "${c.nome}" creato.`, 'success'), onError });
    const createProdotto = useCreateProdotto({ onSuccess: (p) => toast(`Articolo "${p.nome}" creato.`, 'success'), onError });
    const createOrdine = useCreateOrdine({ onSuccess: (o) => toast(`Ordine "${o.numero}" creato in bozza.`, 'success'), onError });
    const createFattura = useCreateFattura({ onSuccess: () => toast('Bozza di fattura salvata.', 'success'), onError });

    // ---- KPI ----
    const mese = oggi.slice(0, 7);
    const fatturatoMese = fatture
        .filter((f) => f.stato === 'emessa' && f.data.startsWith(mese))
        .reduce((s, f) => s + (isNotaCredito(f) ? -1 : 1) * totaliFattura(f).imponibile, 0);
    const aperti = ordini.filter((o) => ordineAperto(o.stato) && o.stato !== 'bozza').length;
    const valoreMagazzino = prodotti.reduce((s, p) => s + valoreGiacenza(p), 0);
    const scaduto = creditiScaduti(fatture, incassi, oggi);

    // ---- grafici ----
    // Aggregazioni su poche centinaia di righe: calcolo diretto, senza memo.
    const serie = fatturatoMensile(fatture, mesi, oggi);
    const perStato = ordiniPerStato(ordini);
    const inCorso = perStato.confermato + perStato['in-preparazione'] + perStato.spedito;
    const top = topProdotti(ordini, 5);

    const nextSku = nextNumber(config.numbering.sku, prodotti.map((p) => p.sku));
    const nextOrdine = nextNumber(config.numbering.ordine, ordini.map((o) => o.numero));

    const quick: Array<{ key: string; visible: boolean; icon: string; label: string; onClick: () => void }> = [
        { key: 'ordine', visible: show.ordine, icon: 'fa-plus', label: 'Nuovo Ordine', onClick: () => setModale('ordine') },
        { key: 'fattura', visible: show.fattura, icon: 'fa-file-invoice', label: 'Nuova Fattura', onClick: () => setModale('fattura') },
        { key: 'cliente', visible: show.cliente, icon: 'fa-user-plus', label: 'Aggiungi Cliente', onClick: () => setModale('cliente') },
        { key: 'prodotto', visible: show.prodotto, icon: 'fa-box', label: 'Aggiungi Prodotto', onClick: () => setModale('prodotto') },
        { key: 'riordino', visible: show.riordino, icon: 'fa-wand-magic-sparkles', label: 'Riordino', onClick: () => navigate('/acquisti') },
        { key: 'report', visible: show.report, icon: 'fa-chart-pie', label: 'Report', onClick: () => navigate('/report') },
    ];

    return (
        <AppLayout pageClass="dashboard-page">
            <Topbar>
                <h1>{greetTitle}</h1>
                <p>{greetDate}</p>
            </Topbar>

            <KpiGrid stagger={stagger} items={[
                { icon: 'fa-euro-sign', variant: 'revenue', label: 'Fatturato del Mese', value: formatEuro(fatturatoMese, 0), trend: { dir: 'up', text: 'imponibile emesso' } },
                { icon: 'fa-cart-shopping', variant: 'orders', label: 'Ordini in Corso', value: formatNumber(aperti), trend: { dir: 'up', text: 'confermati, non consegnati' } },
                { icon: 'fa-warehouse', variant: 'stock', label: 'Valore Magazzino', value: formatEuro(valoreMagazzino, 0), trend: { dir: 'up', text: `${formatNumber(prodotti.length)} articoli` } },
                { icon: 'fa-hourglass-end', variant: 'danger', label: 'Crediti Scaduti', value: formatEuro(scaduto, 0), trend: { dir: 'down', text: 'da sollecitare' } },
            ]} />

            <section className="dashboard-row">
                <div className="neu-panel chart-panel" style={stagger(4)}>
                    <div className="panel-header">
                        <h2>Andamento Fatturato</h2>
                        <div className="panel-actions" role="group" aria-label="Periodo">
                            {([6, 12] as const).map((n) => (
                                <button key={n} type="button" className={`chip-btn${mesi === n ? ' active' : ''}`} aria-pressed={mesi === n} onClick={() => setMesi(n)}>{n}M</button>
                            ))}
                        </div>
                    </div>
                    <div className="chart-container">
                        <RevenueChart labels={serie.map((x) => etichettaMese(x.mese))} data={serie.map((x) => x.valore)} ariaLabel={`Fatturato mensile ultimi ${mesi} mesi`} />
                    </div>
                </div>

                <div className="neu-panel chart-panel chart-panel--small" style={stagger(5)}>
                    <div className="panel-header"><h2>Ordini per Stato</h2></div>
                    <div className="chart-container chart-container--donut">
                        <DonutChart segments={[
                            { value: perStato.consegnato, color: 'var(--erp-accent)', label: 'Consegnati' },
                            { value: inCorso + perStato.bozza, color: 'var(--erp-warning)', label: 'Aperti' },
                            { value: perStato.annullato, color: 'var(--erp-shadow-dark)', label: 'Annullati' },
                        ]} />
                    </div>
                    <div className="donut-legend">
                        <div className="legend-item"><span className="dot dot--completed" />Consegnati ({perStato.consegnato})</div>
                        <div className="legend-item"><span className="dot dot--pending" />Aperti ({inCorso + perStato.bozza})</div>
                        <div className="legend-item"><span className="dot dot--cancelled" />Annullati ({perStato.annullato})</div>
                    </div>
                </div>
            </section>

            <section className="dashboard-row">
                <div className="neu-panel activities-panel" style={stagger(6)}>
                    <div className="panel-header">
                        <h2>Attività Recenti</h2>
                        {show.report && <Link to="/report?tab=attivita" className="panel-link">Vedi tutto <i className="fa-solid fa-arrow-right" /></Link>}
                    </div>
                    {audit.length === 0 ? (
                        <div className="empty-state"><i className="fa-solid fa-clock-rotate-left" /><p>Le operazioni registrate compariranno qui.</p></div>
                    ) : (
                        <ul className="activity-list">
                            {audit.slice(0, 6).map((a) => (
                                <li className="activity-item" key={a.id}>
                                    <div className="activity-icon"><i className={`fa-solid ${a.icon}`} /></div>
                                    <div className="activity-text"><strong>{a.text}</strong><span>{a.userName}</span></div>
                                    <div className="activity-time">{tempoFa(a.at)}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="neu-panel quick-panel" style={stagger(7)}>
                    <div className="panel-header"><h2>Azioni Rapide</h2></div>
                    <div className="quick-grid">
                        {quick.filter((q) => q.visible).map((q) => (
                            <button key={q.key} type="button" className="quick-btn" onClick={q.onClick}>
                                <div className="quick-btn-icon"><i className={`fa-solid ${q.icon}`} /></div>
                                <span>{q.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <section className="dashboard-row">
                <div className="neu-panel table-panel" style={stagger(8)}>
                    <div className="panel-header">
                        <h2>Articoli più Venduti</h2>
                        <Link to="/inventario" className="panel-link">Catalogo <i className="fa-solid fa-arrow-right" /></Link>
                    </div>
                    <div className="table-wrapper">
                        <table className="neu-table">
                            <thead><tr><th scope="col">#</th><th scope="col">Articolo</th><th scope="col">SKU</th><th scope="col">Venduti</th><th scope="col">Ricavo</th></tr></thead>
                            <tbody>
                                {top.length === 0 ? (
                                    <tr><td colSpan={5}><div className="empty-state"><i className="fa-solid fa-chart-simple" /><p>Nessuna vendita registrata.</p></div></td></tr>
                                ) : top.map((p, i) => (
                                    <tr key={p.prodottoId}>
                                        <td>{i + 1}</td>
                                        <td className="cell-strong">{p.nome}</td>
                                        <td className="cell-sku">{p.sku}</td>
                                        <td>{formatNumber(p.quantita)}</td>
                                        <td className="cell-strong">{formatEuro(p.ricavo, 0)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="neu-panel activities-panel" style={stagger(9)}>
                    <div className="panel-header"><h2>Avvisi</h2></div>
                    {notifiche.length === 0 ? (
                        <div className="empty-state"><i className="fa-solid fa-circle-check" /><p>Nessun avviso: tutto in ordine.</p></div>
                    ) : (
                        <ul className="popover-list">
                            {notifiche.map((n) => (
                                <li key={n.id}>
                                    <Link to={n.link} className={`popover-item popover-item--${n.livello}`}>
                                        <i className={`fa-solid ${n.icon}`} aria-hidden="true" />
                                        <span>{n.testo}</span>
                                        <i className="fa-solid fa-chevron-right popover-go" aria-hidden="true" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>

            <OrdineModal
                open={modale === 'ordine'}
                onClose={() => setModale(null)}
                editing={null}
                onSubmit={(v) => { createOrdine.mutate(v); setModale(null); }}
                saving={createOrdine.isPending}
                clienti={clientiRef}
                prodotti={prodotti}
                numeroSuggerito={nextOrdine}
            />
            <FatturaModal
                open={modale === 'fattura'}
                onClose={() => setModale(null)}
                editing={null}
                onSubmit={(v) => { createFattura.mutate(v); setModale(null); }}
                saving={createFattura.isPending}
                clienti={clientiRef}
                prodotti={prodotti}
            />
            <ClientModal
                open={modale === 'cliente'}
                onClose={() => setModale(null)}
                editing={null}
                onSubmit={(v: ClienteFormValues) => { createCliente.mutate(v); setModale(null); }}
                saving={createCliente.isPending}
            />
            <ProdottoModal
                open={modale === 'prodotto'}
                onClose={() => setModale(null)}
                onSubmit={(v) => { createProdotto.mutate(v); setModale(null); }}
                defaults={{ sku: nextSku }}
                fornitori={fornitori}
            />
        </AppLayout>
    );
}
