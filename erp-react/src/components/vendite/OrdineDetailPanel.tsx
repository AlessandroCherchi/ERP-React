import '../../styles/documenti.css';
import { DetailField, DetailPanelShell, DetailStat, PanelActions, type PanelAction } from '../ui/DetailPanelShell';
import { formatDate, formatEuro, formatNumber } from '../../lib/format';
import {
    PRIORITA_LABEL, STATO_ORDINE_LABEL, imponibileRiga, impegnaMagazzino, inRitardo,
    prossimiStati, totaliOrdine, type Ordine, type OrdineStato,
} from '../../types/ordine';

interface OrdineDetailPanelProps {
    ordine: Ordine | null;
    open: boolean;
    /** Data ISO di riferimento per il calcolo del ritardo. */
    oggi: string;
    onClose: () => void;
    /** Modifica/elimina: assenti se il ruolo non le consente. */
    actions: PanelAction[];
    onCambiaStato: (nuovo: OrdineStato) => void;
    /** Transizioni consentite al ruolo corrente (permission §5). Assente = tutte. */
    canTransition?: (nuovo: OrdineStato) => boolean;
    /** true mentre una transizione è in corso: evita doppi click. */
    busy: boolean;
}

/** Etichetta e icona dell'azione che porta allo stato di destinazione. */
const AZIONE: Record<OrdineStato, { label: string; icon: string; danger?: boolean }> = {
    bozza: { label: 'Riporta in bozza', icon: 'fa-rotate-left' },
    confermato: { label: 'Conferma ordine', icon: 'fa-circle-check' },
    'in-preparazione': { label: 'Metti in preparazione', icon: 'fa-boxes-packing' },
    spedito: { label: 'Segna come spedito', icon: 'fa-truck-fast' },
    consegnato: { label: 'Segna come consegnato', icon: 'fa-flag-checkered' },
    annullato: { label: 'Annulla ordine', icon: 'fa-ban', danger: true },
};

/** Pannello dettaglio ordine — guscio condiviso, corpo specifico. */
export function OrdineDetailPanel({
    ordine, open, oggi, onClose, actions, onCambiaStato, canTransition, busy,
}: OrdineDetailPanelProps) {
    return (
        <DetailPanelShell
            open={open}
            title="Dettaglio Ordine"
            onClose={onClose}
            footer={<PanelActions actions={actions} />}
        >
            {ordine && (() => {
                const totali = totaliOrdine(ordine.righe);
                const ritardo = inRitardo(ordine, oggi);
                const avanzamenti = prossimiStati(ordine.stato).filter((s) => !canTransition || canTransition(s));

                return (
                    <div className="detail-panel-body">
                        <div className="detail-avatar">
                            <i className="fa-solid fa-cart-shopping" />
                        </div>
                        <h3 className="detail-name">{ordine.numero}</h3>
                        <span className={`detail-status status-badge status-badge--${ordine.stato}`}>
                            {STATO_ORDINE_LABEL[ordine.stato]}
                        </span>

                        <div className="detail-section">
                            <h4>Testata</h4>
                            <div className="detail-grid">
                                <DetailField label="Cliente" value={ordine.cliente} />
                                <DetailField label="Priorità" value={PRIORITA_LABEL[ordine.priorita]} />
                                <DetailField label="Data ordine" value={formatDate(ordine.data)} />
                                <DetailField
                                    label="Consegna prevista"
                                    value={
                                        ordine.consegna
                                            ? <>
                                                {formatDate(ordine.consegna)}
                                                {ritardo && <span className="ritardo-tag"><i className="fa-solid fa-clock-rotate-left" /> in ritardo</span>}
                                            </>
                                            : ''
                                    }
                                />
                            </div>
                        </div>

                        <div className="detail-section">
                            <h4>Righe ({ordine.righe.length})</h4>
                            <ul className="movement-list">
                                {ordine.righe.map((r) => (
                                    <li className="movement-item" key={r.prodottoId}>
                                        <div className="movement-icon movement-icon--scarico">
                                            <i className="fa-solid fa-box" />
                                        </div>
                                        <div className="movement-text">
                                            <strong>{r.nome}</strong>
                                            <span>
                                                {r.sku} — {formatNumber(r.quantita)} {r.unita} ×{' '}
                                                {formatEuro(r.prezzo)}
                                                {r.sconto > 0 ? ` − ${r.sconto}%` : ''}
                                            </span>
                                        </div>
                                        <div className="movement-qty">{formatEuro(imponibileRiga(r))}</div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="detail-section">
                            <h4>Totali</h4>
                            <div className="detail-stats-row">
                                <DetailStat label="Imponibile" value={formatEuro(totali.imponibile)} />
                                <DetailStat label="IVA" value={formatEuro(totali.iva)} />
                                <DetailStat label="Totale" value={formatEuro(totali.totale)} />
                            </div>
                        </div>

                        <div className="detail-section">
                            <h4>Stato dell&apos;ordine</h4>
                            <p className="detail-notes detail-notes--compact">
                                {impegnaMagazzino(ordine.stato)
                                    ? 'La merce di questo ordine è già stata scaricata dal magazzino. Annullandolo rientra in giacenza.'
                                    : ordine.stato === 'bozza'
                                        ? 'Finché resta in bozza l’ordine non tocca le giacenze. La conferma le scarica.'
                                        : 'Ordine annullato: nessuna quantità risulta impegnata.'}
                            </p>

                            {avanzamenti.length === 0 ? (
                                <p className="detail-notes detail-notes--compact">
                                    {prossimiStati(ordine.stato).length === 0
                                        ? 'Stato finale: non sono previsti ulteriori avanzamenti.'
                                        : 'Il tuo ruolo non può avanzare questo ordine.'}
                                </p>
                            ) : (
                                <div className="stato-actions">
                                    {avanzamenti.map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            className={`neu-action-btn${AZIONE[s].danger ? ' neu-action-btn--danger' : ''}`}
                                            disabled={busy}
                                            onClick={() => onCambiaStato(s)}
                                        >
                                            <i className={`fa-solid ${AZIONE[s].icon}`} />
                                            <span>{AZIONE[s].label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="detail-section">
                            <h4>Note</h4>
                            <p className="detail-notes">{ordine.note || 'Nessuna nota disponibile.'}</p>
                        </div>
                    </div>
                );
            })()}
        </DetailPanelShell>
    );
}
