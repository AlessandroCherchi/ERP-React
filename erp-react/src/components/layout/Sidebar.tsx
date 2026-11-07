import { NavLink, useNavigate } from 'react-router-dom';
import defaultLogo from '../../assets/img/logo.png';
import { useUiStore } from '../../store/uiStore';
import { useConfig } from '../../config/configStore';
import { useVisibleModules } from '../../app/useModules';
import { useAuthStore } from '../../auth/session';
import { useT } from '../../i18n';
import type { ModuleDef } from '../../app/modules';

function NavEntry({ m }: { m: ModuleDef }) {
    const t = useT();
    return (
        <NavLink to={m.path} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <i className={`fa-solid ${m.icon}`} />
            <span>{t(m.labelKey)}</span>
            {!m.page && <em className="nav-badge">{t('nav.soon')}</em>}
        </NavLink>
    );
}

/** Sidebar generata dal registro moduli, filtrata per tenant e ruolo. */
export function Sidebar() {
    const { sidebarCollapsed, sidebarOpen } = useUiStore();
    const config = useConfig();
    const modules = useVisibleModules();
    const logout = useAuthStore((s) => s.logout);
    const navigate = useNavigate();
    const t = useT();

    function handleLogout() {
        logout();
        navigate('/login', { replace: true });
    }

    return (
        <aside className={`sidebar${sidebarCollapsed ? ' collapsed' : ''}${sidebarOpen ? ' open' : ''}`} id="sidebar">
            <div className="sidebar-header">
                <img src={config.brand.logo || defaultLogo} alt={config.brand.name} className="sidebar-logo" />
                <span className="sidebar-brand">{config.brand.name}</span>
            </div>

            <nav className="sidebar-nav">
                {modules.filter((m) => m.placement === 'main').map((m) => <NavEntry key={m.id} m={m} />)}
            </nav>

            <div className="sidebar-footer">
                {modules.filter((m) => m.placement === 'footer').map((m) => <NavEntry key={m.id} m={m} />)}
                <button type="button" className="nav-item nav-item--button" onClick={handleLogout}>
                    <i className="fa-solid fa-right-from-bracket" />
                    <span>{t('nav.logout')}</span>
                </button>
            </div>
        </aside>
    );
}
