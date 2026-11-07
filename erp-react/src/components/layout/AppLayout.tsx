import { useEffect, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useUiStore } from '../../store/uiStore';

interface AppLayoutProps {
    /** .dashboard-page | .clienti-page — CSS legacy scoped per pagina (vedi styles/*.css). */
    pageClass: string;
    children: ReactNode;
}

/** Layout condiviso post-login: sidebar + main-content, porting 1:1 di dashboard.html/clienti.html. */
export function AppLayout({ pageClass, children }: AppLayoutProps) {
    const { sidebarOpen, closeMobileSidebar } = useUiStore();

    // chiusura sidebar mobile al click fuori — porting 1:1 di initSidebar() in dashboard.js
    useEffect(() => {
        if (!sidebarOpen) return;

        function onDocClick(e: MouseEvent) {
            const sidebarEl = document.getElementById('sidebar');
            const toggleBtn = document.querySelector('.topbar .neu-icon-btn');
            const target = e.target as Node;
            if (sidebarEl && !sidebarEl.contains(target) && toggleBtn && !toggleBtn.contains(target)) {
                closeMobileSidebar();
            }
        }

        document.addEventListener('click', onDocClick);
        return () => document.removeEventListener('click', onDocClick);
    }, [sidebarOpen, closeMobileSidebar]);

    return (
        <div className={pageClass}>
            <Sidebar />
            <main className="main-content">{children}</main>
        </div>
    );
}
