import type { ReactNode } from 'react';
import { useUiStore } from '../../store/uiStore';
import { useSession } from '../../auth/session';
import { useT } from '../../i18n';
import { GlobalSearch } from './GlobalSearch';
import { NotificationsMenu } from './NotificationsMenu';

interface TopbarProps {
    /** Slot titolo/sottotitolo della pagina. */
    children: ReactNode;
}

function initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('');
}

/** Topbar: toggle sidebar, ricerca globale, notifiche, utente corrente. */
export function Topbar({ children }: TopbarProps) {
    const { toggleSidebar } = useUiStore();
    const session = useSession();
    const t = useT();
    const user = session?.user;

    return (
        <header className="topbar">
            <div className="topbar-left">
                <button className="neu-icon-btn" onClick={toggleSidebar} aria-label={t('nav.toggleSidebar')}>
                    <i className="fa-solid fa-bars" />
                </button>
                <div className="topbar-greeting">{children}</div>
            </div>
            <div className="topbar-right">
                <GlobalSearch />
                <NotificationsMenu />
                {user && (
                    <div className="user-chip" title={`${user.name} — ${user.email}`}>
                        <div className="user-avatar" aria-hidden="true">{initials(user.name)}</div>
                        <div className="user-chip-text">
                            <strong>{user.name}</strong>
                            <span>{t(`roles.${user.role}`)}</span>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
