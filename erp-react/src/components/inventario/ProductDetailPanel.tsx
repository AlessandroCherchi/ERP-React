import { StockBar } from './StockBar';
import { formatDate, formatEuro } from '../../lib/format';
import {
    margineUnitario, MOVIMENTO_LABEL, statoProdotto, STATO_LABEL, valoreGiacenza,
    type Movimento, type Prodotto,
} from '../../types/prodotto';

interface ProductDetailPanelProps {
    prodotto: Prodotto | null;
    /** Movimenti del solo prodotto aperto, già ordinati dal più recente. */
    movimenti: Movimento[];
    open: boolean;
    onClose: () => void;
    onMove?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

/** Segno con cui il movimento ha inciso sulla giacenza. */
function segno(m: Movimento): string {
    if (m.tipo === 'rettifica') return '=';
    return m.tipo === 'carico' ? '+' : '−';
}

/** Pannello dettaglio articolo — stessa struttura di ClientDetailPanel, con storico movimenti. */
export function ProductDetailPanel({
    prodotto, movimenti, open, onClose, onMove, onEdit, onDelete,
}: ProductDetailPanelProps) {
    const stato = prodotto ? statoProdotto(prodotto) : 'disponibile';

    return (
        <>
            <div className={`detail-overlay${open ? ' open' : ''}`} onClick={onClose} />
            <aside className={`detail-panel${open ? ' open' : ''}`} aria-hidden={!open}>
                <div className="detail-panel-header">
                    <h2>Dettaglio Articolo</h2>
                    <button
                        type="button"
                        className="neu-icon-btn neu-icon-btn--sm"
                        onClick={onClose}
                        aria-label="Chiudi dettaglio"
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>

                {prodotto && (
                    <div className="detail-panel-body">
                        <div className="detail-avatar">
                            <i className="fa-solid fa-box" />
                        </div>
                        <h3 className="detail-name">{prodotto.nome}</h3>
                        <span className={`detail-status status-badge status-badge--${stato}`}>
                            {STATO_LABEL[stato]}
                        </span>

                        <div className="detail-section">
                            <h4>Livello di Scorta</h4>
                            <StockBar
                                giacenza={prodotto.giacenza}
                                scorta={prodotto.scorta}
                                unita={prodotto.unita}
                            />
                            <p className="detail-notes detail-notes--compact">
                                Soglia di riordino: {prodotto.scorta.toLocaleString('it-IT')} {prodotto.unita}
                            </p>
                        </div>

                        <div className="detail-section">
                            <h4>Dati Articolo</h4>
                            <div className="detail-grid">
                                <div className="detail-field">
                                    <span className="detail-field-label">SKU</span>
                                    <span className="detail-field-value">{prodotto.sku}</span>
                                </div>
                                <div className="detail-field">
                                    <span className="detail-field-label">Categoria</span>
                                    <span className="detail-field-value">{prodotto.categoria}</span>
                                </div>
                                <div className="detail-field">
                                    <span className="detail-field-label">Fornitore</span>
                                    <span className="detail-field-value">{prodotto.fornitore || '—'}</span>
                                </div>
                                <div className="detail-field">
                                    <span className="detail-field-label">Ubicazione</span>
                                    <span className="detail-field-value">{prodotto.ubicazione || '—'}</span>
                                </div>
                                <div className="detail-field">
                                    <span className="detail-field-label">Unità di misura</span>
                                    <span className="detail-field-value">{prodotto.unita}</span>
                                </div>
                                <div className="detail-field">
                                    <span className="detail-field-label">Aliquota IVA</span>
                                    <span className="detail-field-value">{prodotto.iva}%</span>
                                </div>
                            </div>
                        </div>

                        <div className="detail-section">
                            <h4>Valorizzazione</h4>
                            <div className="detail-stats-row">
                                <div className="detail-stat">
                                    <span className="detail-stat-value">{formatEuro(prodotto.costo)}</span>
                                    <span className="detail-stat-label">Costo</span>
                                </div>
                                <div className="detail-stat">
                                    <span className="detail-stat-value">{formatEuro(prodotto.prezzo)}</span>
                                    <span className="detail-stat-label">Prezzo</span>
                                </div>
                                <div className="detail-stat">
                                    <span className="detail-stat-value">{formatEuro(margineUnitario(prodotto))}</span>
                                    <span className="detail-stat-label">Margine</span>
                                </div>
                            </div>
                            <p className="detail-notes detail-notes--compact">
                                Valore a magazzino: <strong>{formatEuro(valoreGiacenza(prodotto), 2)}</strong>
                                {' '}({prodotto.giacenza.toLocaleString('it-IT')} × {formatEuro(prodotto.costo)})
                            </p>
                        </div>

                        <div className="detail-section">
                            <h4>Ultimi Movimenti</h4>
                            {movimenti.length === 0 ? (
                                <p className="detail-notes">Nessun movimento registrato per questo articolo.</p>
                            ) : (
                                <ul className="movement-list">
                                    {movimenti.map((m) => (
                                        <li className="movement-item" key={m.id}>
                                            <div className={`movement-icon movement-icon--${m.tipo}`}>
                                                <i
                                                    className={`fa-solid ${m.tipo === 'carico'
                                                        ? 'fa-arrow-down'
                                                        : m.tipo === 'scarico'
                                                            ? 'fa-arrow-up'
                                                            : 'fa-scale-balanced'
                                                        }`}
                                                />
                                            </div>
                                            <div className="movement-text">
                                                <strong>{MOVIMENTO_LABEL[m.tipo]} · {m.causale}</strong>
                                                <span>
                                                    {formatDate(m.data)} — giacenza dopo:{' '}
                                                    {m.giacenzaFinale.toLocaleString('it-IT')} {prodotto.unita}
                                                </span>
                                            </div>
                                            <div className={`movement-qty movement-qty--${m.tipo}`}>
                                                {segno(m)}{m.quantita.toLocaleString('it-IT')}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="detail-section">
                            <h4>Descrizione</h4>
                            <p className="detail-notes">{prodotto.descrizione || 'Nessuna descrizione disponibile.'}</p>
                        </div>
                    </div>
                )}

                <div className="detail-panel-footer">
                    {onMove && (
                        <button type="button" className="neu-action-btn neu-action-btn--outline" onClick={onMove}>
                            <i className="fa-solid fa-right-left" /> <span>Movimento</span>
                        </button>
                    )}
                    {onEdit && (
                        <button type="button" className="neu-action-btn neu-action-btn--outline" onClick={onEdit}>
                            <i className="fa-solid fa-pen" /> <span>Modifica</span>
                        </button>
                    )}
                    {onDelete && (
                        <button type="button" className="neu-action-btn neu-action-btn--danger" onClick={onDelete}>
                            <i className="fa-solid fa-trash-can" /> <span>Elimina</span>
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
}
