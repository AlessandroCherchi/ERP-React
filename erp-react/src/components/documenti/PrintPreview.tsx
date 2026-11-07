import { createPortal } from 'react-dom';
import defaultLogo from '../../assets/img/logo.png';
import { useConfig } from '../../config/configStore';
import { formatDate, formatEuro, formatNumber } from '../../lib/format';
import { imponibileRiga, riepilogoIva, totaliDocumento, type RigaDocumento } from '../../types/documento';
import '../../styles/print.css';

export interface PrintableDocument {
    titolo: string;
    numero: string;
    data: string;
    /** Intestatario: righe di testo (ragione sociale, indirizzo, P.IVA…). */
    destinatario: { etichetta: string; righe: string[] };
    /** Coppie etichetta/valore sotto la testata (scadenza, pagamento…). */
    dettagli?: Array<[string, string]>;
    righe: RigaDocumento[];
    note?: string;
    /** Avvertenza in calce (es. "copia di cortesia"). */
    piede?: string;
}

/**
 * Anteprima di stampa di un documento (modello unico per ordini, DDT,
 * fatture). Montata in un portal sul body; il foglio print.css nasconde
 * l'app e stampa solo questo nodo. Intestazione da config del tenant.
 */
export function PrintPreview({ doc, onClose }: { doc: PrintableDocument | null; onClose: () => void }) {
    const config = useConfig();
    if (!doc) return null;
    const totali = totaliDocumento(doc.righe);
    const riepilogo = riepilogoIva(doc.righe);

    return createPortal(
        <div className="print-overlay" role="dialog" aria-modal="true" aria-label={`Anteprima ${doc.titolo} ${doc.numero}`}>
            <div className="print-toolbar no-print">
                <button type="button" className="neu-action-btn" onClick={() => window.print()}><i className="fa-solid fa-print" /> Stampa / PDF</button>
                <button type="button" className="neu-action-btn neu-action-btn--outline" onClick={onClose}><i className="fa-solid fa-xmark" /> Chiudi</button>
            </div>
            <article className="print-sheet print-area">
                <header className="print-header">
                    <div className="print-company">
                        <img src={config.brand.logo || defaultLogo} alt="" />
                        <div>
                            <strong>{config.company.ragioneSociale}</strong>
                            <span>{config.company.indirizzo}</span>
                            <span>P.IVA {config.company.piva} · {config.company.email}</span>
                        </div>
                    </div>
                    <div className="print-doc">
                        <h1>{doc.titolo}</h1>
                        <span>N. <strong>{doc.numero}</strong> del {formatDate(doc.data)}</span>
                    </div>
                </header>

                <section className="print-parties">
                    <div>
                        <small>{doc.destinatario.etichetta}</small>
                        {doc.destinatario.righe.filter(Boolean).map((r, i) => <span key={i} className={i === 0 ? 'print-strong' : undefined}>{r}</span>)}
                    </div>
                    {doc.dettagli && (
                        <dl>
                            {doc.dettagli.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
                        </dl>
                    )}
                </section>

                <table className="print-table">
                    <thead>
                        <tr><th>Codice</th><th>Descrizione</th><th>Q.tà</th><th>U.M.</th><th>Prezzo</th><th>Sc. %</th><th>IVA</th><th>Importo</th></tr>
                    </thead>
                    <tbody>
                        {doc.righe.map((r, i) => (
                            <tr key={`${r.prodottoId}-${i}`}>
                                <td>{r.sku}</td><td>{r.nome}</td><td>{formatNumber(r.quantita, Number.isInteger(r.quantita) ? 0 : 2)}</td><td>{r.unita}</td>
                                <td>{formatEuro(r.prezzo)}</td><td>{r.sconto || ''}</td><td>{r.iva}%</td><td>{formatEuro(imponibileRiga(r))}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <section className="print-summary">
                    <table className="print-iva">
                        <thead><tr><th>Aliquota</th><th>Imponibile</th><th>Imposta</th></tr></thead>
                        <tbody>
                            {riepilogo.map((x) => <tr key={x.aliquota}><td>{x.aliquota}%</td><td>{formatEuro(x.imponibile)}</td><td>{formatEuro(x.imposta)}</td></tr>)}
                        </tbody>
                    </table>
                    <dl className="print-totals">
                        <div><dt>Imponibile</dt><dd>{formatEuro(totali.imponibile)}</dd></div>
                        <div><dt>IVA</dt><dd>{formatEuro(totali.iva)}</dd></div>
                        <div className="print-grand"><dt>Totale</dt><dd>{formatEuro(totali.totale)}</dd></div>
                    </dl>
                </section>

                {doc.note && <p className="print-note">{doc.note}</p>}
                {doc.piede && <footer className="print-footer">{doc.piede}</footer>}
            </article>
        </div>,
        document.body
    );
}
