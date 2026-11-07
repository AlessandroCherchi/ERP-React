import type { ReactNode } from 'react';
import { useUiStore } from '../../store/uiStore';

interface TopbarProps {
    /** Slot titolo/sottotitolo: greeting dinamico (dashboard) o statico (clienti). */
    children: ReactNode;
}

/** Topbar identica a dashboard.html/clienti.html: toggle sidebar, ricerca, notifiche, avatar. */
export function Topbar({ children }: TopbarProps) {
    const { toggleSidebar } = useUiStore();

    return (
        <header className="topbar">
            <div className="topbar-left">
                <button className="neu-icon-btn" onClick={toggleSidebar} aria-label="Toggle sidebar">
                    <i className="fa-solid fa-bars" />
                </button>
                <div className="topbar-greeting">{children}</div>
            </div>
            <div className="topbar-right">
                <div className="search-box">
                    <i className="fa-solid fa-magnifying-glass" />
                    <input type="text" placeholder="Cerca nell'ERP..." autoComplete="off" />
                </div>
                <button className="neu-icon-btn notification-btn" aria-label="Notifiche">
                    <i className="fa-solid fa-bell" />
                    <span className="notif-badge">3</span>
                </button>
                <div className="user-avatar">
                    <i className="fa-solid fa-user-tie" />
                </div>
            </div>
        </header>
    );
}
