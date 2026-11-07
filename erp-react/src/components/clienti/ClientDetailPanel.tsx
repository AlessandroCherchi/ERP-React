import type { Cliente } from '../../types/cliente';

interface ClientDetailPanelProps {
    cliente: Cliente | null;
    open: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

function capitalise(str: string): string {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

/** Pannello dettaglio a scomparsa — porting 1:1 di #detailPanel in clienti.html. */
export function ClientDetailPanel({ cliente, open, onClose, onEdit, onDelete }: ClientDetailPanelProps) {
    return (
        <>
            <div className={`detail-overlay${open ? ' open' : ''}`} onClick={onClose} />
            <aside className={`detail-panel${open ? ' open' : ''}`}>
                <div className="detail-panel-header">
                    <h2>Dettaglio Cliente</h2>
                    <button className="neu-icon-btn neu-icon-btn--sm" onClick={onClose} aria-label="Chiudi dettaglio">
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>

                {cliente && (
                    <div className="detail-panel-body">
                        <div className="detail-avatar">
                            <i className="fa-solid fa-user" />
                        </div>
                        <h3 className="detail-name">{cliente.nome}</h3>
                        <span className={`detail-status status-badge status-badge--${cliente.stato}`}>
                            {capitalise(cliente.stato)}
                        </span>

                        <div className="detail-section">
                            <h4>Informazioni di Contatto</h4>
                            <div className="detail-grid">
                                <div className="detail-field">
                                    <span className="detail-field-label">Email</span>
                                    <span className="detail-field-value">{cliente.email || '—'}</span>
                                </div>
                                <div className="detail-field">
                                    <span className="detail-field-label">Telefono</span>
                                    <span className="detail-field-value">{cliente.telefono || '—'}</span>
                                </div>
                                <div className="detail-field">
                                    <span className="detail-field-label">Indirizzo</span>
                                    <span className="detail-field-value">{cliente.indirizzo || '—'}</span>
                                </div>
                                <div className="detail-field">
                                    <span className="detail-field-label">Città</span>
                                    <span className="detail-field-value">
                                        {cliente.citta}{cliente.provincia ? ` (${cliente.provincia})` : ''}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="detail-section">
                            <h4>Dati Aziendali</h4>
                            <div className="detail-grid">
                                <div className="detail-field">
                                    <span className="detail-field-label">P.IVA</span>
                                    <span className="detail-field-value">{cliente.piva || '—'}</span>
                                </div>
                                <div className="detail-field">
                                    <span className="detail-field-label">Cod. Fiscale</span>
                                    <span className="detail-field-value">{cliente.cf || '—'}</span>
                                </div>
                                <div className="detail-field">
                                    <span className="detail-field-label">PEC</span>
                                    <span className="detail-field-value">{cliente.pec || '—'}</span>
                                </div>
                                <div className="detail-field">
                                    <span className="detail-field-label">SDI</span>
                                    <span className="detail-field-value">{cliente.sdi || '—'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="detail-section">
                            <h4>Panoramica Economica</h4>
                            <div className="detail-stats-row">
                                <div className="detail-stat">
                                    <span className="detail-stat-value">€ {cliente.fatturato.toLocaleString('it-IT')}</span>
                                    <span className="detail-stat-label">Fatturato</span>
                                </div>
                                <div className="detail-stat">
                                    <span className="detail-stat-value">{cliente.ordini}</span>
                                    <span className="detail-stat-label">Ordini</span>
                                </div>
                                <div className="detail-stat">
                                    <span className="detail-stat-value">€ {cliente.credito.toLocaleString('it-IT')}</span>
                                    <span className="detail-stat-label">Credito</span>
                                </div>
                            </div>
                        </div>

                        <div className="detail-section">
                            <h4>Note</h4>
                            <p className="detail-notes">{cliente.note || 'Nessuna nota disponibile.'}</p>
                        </div>
                    </div>
                )}

                <div className="detail-panel-footer">
                    <button className="neu-action-btn neu-action-btn--outline" onClick={onEdit}>
                        <i className="fa-solid fa-pen" /> <span>Modifica</span>
                    </button>
                    <button className="neu-action-btn neu-action-btn--danger" onClick={onDelete}>
                        <i className="fa-solid fa-trash-can" /> <span>Elimina</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
