import { DetailField, DetailPanelShell, DetailStat } from '../ui/DetailPanelShell';
import { formatEuro } from '../../lib/format';
import { labelPagamento, STATO_FORNITORE_LABEL, type Fornitore } from '../../types/fornitore';
import type { Prodotto } from '../../types/prodotto';

interface FornitoreDetailPanelProps {
    fornitore: Fornitore | null;
    /** Articoli di magazzino forniti da questo fornitore. */
    articoli: Prodotto[];
    open: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

/** Pannello dettaglio fornitore — guscio condiviso, corpo specifico. */
export function FornitoreDetailPanel({
    fornitore, articoli, open, onClose, onEdit, onDelete,
}: FornitoreDetailPanelProps) {
    return (
        <DetailPanelShell
            open={open}
            title="Dettaglio Fornitore"
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="neu-action-btn neu-action-btn--outline" onClick={onEdit}>
                        <i className="fa-solid fa-pen" /> <span>Modifica</span>
                    </button>
                    <button type="button" className="neu-action-btn neu-action-btn--danger" onClick={onDelete}>
                        <i className="fa-solid fa-trash-can" /> <span>Elimina</span>
                    </button>
                </>
            }
        >
            {fornitore && (
                <div className="detail-panel-body">
                    <div className="detail-avatar">
                        <i className="fa-solid fa-truck-field" />
                    </div>
                    <h3 className="detail-name">{fornitore.nome}</h3>
                    <span className={`detail-status status-badge status-badge--${fornitore.stato}`}>
                        {STATO_FORNITORE_LABEL[fornitore.stato]}
                    </span>

                    <div className="detail-section">
                        <h4>Informazioni di Contatto</h4>
                        <div className="detail-grid">
                            <DetailField label="Email" value={fornitore.email} />
                            <DetailField label="Telefono" value={fornitore.telefono} />
                            <DetailField label="Indirizzo" value={fornitore.indirizzo} />
                            <DetailField
                                label="Città"
                                value={fornitore.citta ? `${fornitore.citta}${fornitore.provincia ? ` (${fornitore.provincia})` : ''}` : ''}
                            />
                        </div>
                    </div>

                    <div className="detail-section">
                        <h4>Dati Aziendali</h4>
                        <div className="detail-grid">
                            <DetailField label="P.IVA" value={fornitore.piva} />
                            <DetailField label="Cod. Fiscale" value={fornitore.cf} />
                            <DetailField label="PEC" value={fornitore.pec} />
                            <DetailField label="SDI" value={fornitore.sdi} />
                        </div>
                    </div>

                    <div className="detail-section">
                        <h4>Condizioni di Fornitura</h4>
                        <div className="detail-grid">
                            <DetailField label="Categoria" value={fornitore.categoria} />
                            <DetailField label="Pagamento" value={labelPagamento(fornitore.pagamento)} />
                            <DetailField label="Lead time" value={`${fornitore.leadTime} giorni`} />
                            <DetailField label="IBAN" value={fornitore.iban} />
                        </div>
                    </div>

                    <div className="detail-section">
                        <h4>Panoramica Economica</h4>
                        <div className="detail-stats-row">
                            <DetailStat label="Acquistato" value={formatEuro(fornitore.acquistato, 0)} />
                            <DetailStat label="Ordini" value={fornitore.ordini} />
                            <DetailStat label="Debito" value={formatEuro(fornitore.debito, 0)} />
                        </div>
                    </div>

                    <div className="detail-section">
                        <h4>Articoli Forniti</h4>
                        {articoli.length === 0 ? (
                            <p className="detail-notes">Nessun articolo di magazzino collegato a questo fornitore.</p>
                        ) : (
                            <ul className="movement-list">
                                {articoli.map((p) => (
                                    <li className="movement-item" key={p.id}>
                                        <div className="movement-icon movement-icon--rettifica">
                                            <i className="fa-solid fa-box" />
                                        </div>
                                        <div className="movement-text">
                                            <strong>{p.nome}</strong>
                                            <span>{p.sku} — giacenza {p.giacenza.toLocaleString('it-IT')} {p.unita}</span>
                                        </div>
                                        <div className="movement-qty">{formatEuro(p.costo)}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="detail-section">
                        <h4>Note</h4>
                        <p className="detail-notes">{fornitore.note || 'Nessuna nota disponibile.'}</p>
                    </div>
                </div>
            )}
        </DetailPanelShell>
    );
}
