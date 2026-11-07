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
 * Porting 1:1 di #detailPanel in clienti.html. Tutti i pannelli dettaglio
 * (clienti, fornitori, articoli, ordini, documenti) lo usano: cambia solo il corpo.
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

/** Azione nel footer del pannello. */
export interface PanelAction {
    id: string;
    label: string;
    icon: string;
    onClick: () => void;
    variant?: 'outline' | 'danger' | 'primary';
    /** Motivo per cui l'azione non è eseguibile (bottone disabilitato con tooltip). */
    disabledReason?: string | false;
}

/** Footer standard: le azioni assenti dall'array non sono permesse al ruolo. */
export function PanelActions({ actions }: { actions: PanelAction[] }) {
    return (
        <>
            {actions.map((a) => (
                <button
                    key={a.id}
                    type="button"
                    className={`neu-action-btn${a.variant && a.variant !== 'primary' ? ` neu-action-btn--${a.variant}` : ''}`}
                    disabled={Boolean(a.disabledReason)}
                    title={a.disabledReason || undefined}
                    onClick={a.onClick}
                >
                    <i className={`fa-solid ${a.icon}`} /> <span>{a.label}</span>
                </button>
            ))}
        </>
    );
}

/** Intestazione del corpo: avatar, nome e badge di stato. */
export function DetailHeader({ icon, name, status }: { icon: string; name: string; status?: { className: string; label: string } }) {
    return (
        <>
            <div className="detail-avatar"><i className={`fa-solid ${icon}`} /></div>
            <h3 className="detail-name">{name}</h3>
            {status && <span className={`detail-status status-badge status-badge--${status.className}`}>{status.label}</span>}
        </>
    );
}

/** Sezione titolata del corpo del pannello. */
export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="detail-section">
            <h4>{title}</h4>
            {children}
        </div>
    );
}
