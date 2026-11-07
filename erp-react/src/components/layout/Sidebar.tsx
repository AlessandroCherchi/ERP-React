import { NavLink } from 'react-router-dom';
import logo from '../../assets/img/logo.png';
import { useUiStore } from '../../store/uiStore';

interface NavItem {
    to: string;
    icon: string;
    label: string;
    /** true = link non ancora implementato (porting futuro), resta '#'. */
    stub?: boolean;
}

const NAV_ITEMS: NavItem[] = [
    { to: '/dashboard', icon: 'fa-grid-2', label: 'Dashboard' },
    { to: '/vendite', icon: 'fa-chart-line', label: 'Vendite' },
    { to: '/inventario', icon: 'fa-boxes-stacked', label: 'Inventario' },
    { to: '/clienti', icon: 'fa-users', label: 'Clienti' },
    { to: '/fornitori', icon: 'fa-truck-field', label: 'Fornitori' },
    { to: '#', icon: 'fa-file-invoice-dollar', label: 'Fatture', stub: true },
    { to: '#', icon: 'fa-calculator', label: 'Contabilità', stub: true },
    { to: '#', icon: 'fa-chart-pie', label: 'Report', stub: true },
];

/** Sidebar identica a dashboard.html/clienti.html: stessa nav, stesso stato collapsed/open. */
export function Sidebar() {
    const { sidebarCollapsed, sidebarOpen } = useUiStore();

    return (
        <aside className={`sidebar${sidebarCollapsed ? ' collapsed' : ''}${sidebarOpen ? ' open' : ''}`} id="sidebar">
            <div className="sidebar-header">
                <img src={logo} alt="Logo ERP" className="sidebar-logo" />
                <span className="sidebar-brand">ERP Suite</span>
            </div>

            <nav className="sidebar-nav">
                {NAV_ITEMS.map((item) =>
                    item.stub ? (
                        <a href="#!" className="nav-item" key={item.label} onClick={(e) => e.preventDefault()}>
                            <i className={`fa-solid ${item.icon}`} />
                            <span>{item.label}</span>
                        </a>
                    ) : (
                        <NavLink
                            to={item.to}
                            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                            key={item.label}
                        >
                            <i className={`fa-solid ${item.icon}`} />
                            <span>{item.label}</span>
                        </NavLink>
                    )
                )}
            </nav>

            <div className="sidebar-footer">
                <a href="#!" className="nav-item" onClick={(e) => e.preventDefault()}>
                    <i className="fa-solid fa-gear" />
                    <span>Impostazioni</span>
                </a>
                <NavLink to="/login" className="nav-item">
                    <i className="fa-solid fa-right-from-bracket" />
                    <span>Esci</span>
                </NavLink>
            </div>
        </aside>
    );
}
