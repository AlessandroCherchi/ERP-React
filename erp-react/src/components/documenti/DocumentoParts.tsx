// Blocchi di visualizzazione comuni ai pannelli dettaglio dei documenti
// (ordini di vendita, ordini d'acquisto, fatture).

import { DetailSection, DetailStat } from '../ui/DetailPanelShell';
import { formatEuro, formatNumber } from '../../lib/format';
import { imponibileRiga, riepilogoIva, totaliDocumento, type RigaDocumento } from '../../types/documento';
import '../../styles/documenti.css';

/** Elenco righe; `progress` mostra un avanzamento (es. ricevuto/ordinato). */
export function RigheList<R extends RigaDocumento>({ righe, icon = 'fa-box', tone = 'scarico', progress }: {
    righe: readonly R[];
    icon?: string;
    tone?: 'carico' | 'scarico' | 'rettifica';
    progress?: (r: R) => { done: number; label: string };
}) {
    return (
        <DetailSection title={`Righe (${righe.length})`}>
            <ul className="movement-list">
                {righe.map((r) => {
                    const p = progress?.(r);
                    return (
                        <li className="movement-item" key={r.prodottoId}>
                            <div className={`movement-icon movement-icon--${tone}`}><i className={`fa-solid ${icon}`} /></div>
                            <div className="movement-text">
                                <strong>{r.nome}</strong>
                                <span>
                                    {r.sku} — {formatNumber(r.quantita)} {r.unita} × {formatEuro(r.prezzo)}
                                    {r.sconto > 0 ? ` − ${r.sconto}%` : ''}
                                </span>
                                {p && (
                                    <span>
                                        <span className="progress-mini" aria-hidden="true"><span style={{ width: `${Math.round(p.done * 100)}%` }} /></span>
                                        {p.label}
                                    </span>
                                )}
                            </div>
                            <div className="movement-qty">{formatEuro(imponibileRiga(r))}</div>
                        </li>
                    );
                })}
            </ul>
        </DetailSection>
    );
}

/** Totali con riepilogo IVA per aliquota. */
export function TotaliBlock({ righe }: { righe: readonly RigaDocumento[] }) {
    const t = totaliDocumento(righe);
    const riepilogo = riepilogoIva(righe);
    return (
        <DetailSection title="Totali">
            <div className="detail-stats-row">
                <DetailStat label="Imponibile" value={formatEuro(t.imponibile)} />
                <DetailStat label="IVA" value={formatEuro(t.iva)} />
                <DetailStat label="Totale" value={formatEuro(t.totale)} />
            </div>
            {riepilogo.length > 1 && (
                <ul className="riepilogo-iva">
                    {riepilogo.map((x) => (
                        <li key={x.aliquota}>IVA {x.aliquota}% su {formatEuro(x.imponibile)}: <strong>{formatEuro(x.imposta)}</strong></li>
                    ))}
                </ul>
            )}
        </DetailSection>
    );
}

export interface StatoAction {
    id: string;
    label: string;
    icon: string;
    onClick: () => void;
    danger?: boolean;
}

/** Azioni di avanzamento del ciclo di vita, con nota contestuale. */
export function StatoActions({ title, note, actions, busy, emptyText }: {
    title: string;
    note: string;
    actions: StatoAction[];
    busy: boolean;
    emptyText: string;
}) {
    return (
        <DetailSection title={title}>
            <p className="detail-notes detail-notes--compact">{note}</p>
            {actions.length === 0 ? (
                <p className="detail-notes detail-notes--compact">{emptyText}</p>
            ) : (
                <div className="stato-actions">
                    {actions.map((a) => (
                        <button key={a.id} type="button" className={`neu-action-btn${a.danger ? ' neu-action-btn--danger' : ''}`} disabled={busy} onClick={a.onClick}>
                            <i className={`fa-solid ${a.icon}`} /> <span>{a.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </DetailSection>
    );
}
