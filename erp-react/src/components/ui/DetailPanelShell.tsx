import type { ReactNode } from 'react';

interface DetailPanelShellProps {
    open: boolean;
    title: string;
    onClose: () => void;
    /** Pulsanti azione in fondo al pannello. */
    footer: ReactNode;
    /** Contenuto scrollabile; assente finché non c'è una riga selezionata. */
    children: ReactNode;
}

/**
 * Guscio del pannello dettaglio a scomparsa (overlay + header + body + footer).
 * Porting 1:1 di #detailPanel in clienti.html, estratto perché Clienti,
 * Inventario e Fornitori ne condividono la struttura: cambia solo il corpo.
 */
export function DetailPanelShell({ open, title, onClose, footer, children }: DetailPanelShellProps) {
    return (
        <>
            <div className={`detail-overlay${open ? ' open' : ''}`} onClick={onClose} />
            <aside className={`detail-panel${open ? ' open' : ''}`} aria-hidden={!open}>
                <div className="detail-panel-header">
                    <h2>{title}</h2>
                    <button
                        type="button"
                        className="neu-icon-btn neu-icon-btn--sm"
                        onClick={onClose}
                        aria-label="Chiudi dettaglio"
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>

                {children}

                <div className="detail-panel-footer">{footer}</div>
            </aside>
        </>
    );
}

/** Riga etichetta/valore della griglia dati del pannello. */
export function DetailField({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="detail-field">
            <span className="detail-field-label">{label}</span>
            <span className="detail-field-value">{value || '—'}</span>
        </div>
    );
}

/** Statistica in evidenza (valore grande + etichetta). */
export function DetailStat({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="detail-stat">
            <span className="detail-stat-value">{value}</span>
            <span className="detail-stat-label">{label}</span>
        </div>
    );
}
