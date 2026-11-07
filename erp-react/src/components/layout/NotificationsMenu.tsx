import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifiche } from '../../hooks/useNotifiche';
import { useDismiss } from '../../hooks/useDismiss';
import { useT } from '../../i18n';

/** Campanella con avvisi derivati dai dati (scorte, ritardi, SDI, scadenze). */
export function NotificationsMenu() {
    const t = useT();
    const notifiche = useNotifiche();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const close = useCallback(() => setOpen(false), []);
    useDismiss(ref, open, close);

    return (
        <div className="popover-anchor" ref={ref}>
            <button
                type="button"
                className="neu-icon-btn notification-btn"
                aria-label={`${t('topbar.notifications')}${notifiche.length ? ` (${notifiche.length})` : ''}`}
                aria-expanded={open}
                aria-haspopup="dialog"
                onClick={() => setOpen((o) => !o)}
            >
                <i className="fa-solid fa-bell" />
                {notifiche.length > 0 && <span className="notif-badge">{notifiche.length}</span>}
            </button>
            {open && (
                <div className="popover" role="dialog" aria-label={t('topbar.notifications')}>
                    <h3 className="popover-title">{t('topbar.notifications')}</h3>
                    {notifiche.length === 0 ? (
                        <p className="popover-empty"><i className="fa-solid fa-circle-check" /> {t('topbar.allClear')}</p>
                    ) : (
                        <ul className="popover-list">
                            {notifiche.map((n) => (
                                <li key={n.id}>
                                    <Link to={n.link} className={`popover-item popover-item--${n.livello}`} onClick={close}>
                                        <i className={`fa-solid ${n.icon}`} aria-hidden="true" />
                                        <span>{n.testo}</span>
                                        <i className="fa-solid fa-chevron-right popover-go" aria-hidden="true" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
