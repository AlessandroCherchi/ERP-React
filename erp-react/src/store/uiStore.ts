// UI state — Implementation Contract v3.1 §3: Zustand, solo stato
// effimero (mai dati contabili/autorevoli: quelli passano da TanStack
// Query / RxDB outbox una volta collegato il backend).

import { create } from 'zustand';

interface UiState {
    /** Sidebar minimizzata (desktop, >960px) — porting da dashboard.js isMobile()==false. */
    sidebarCollapsed: boolean;
    /** Sidebar aperta come overlay (mobile, <=960px). */
    sidebarOpen: boolean;
    toggleSidebar: () => void;
    closeMobileSidebar: () => void;

    rememberMe: boolean;
    setRememberMe: (v: boolean) => void;
}

const isMobile = () => typeof window !== 'undefined' && window.innerWidth <= 960;

export const useUiStore = create<UiState>((set) => ({
    sidebarCollapsed: false,
    sidebarOpen: false,

    toggleSidebar: () =>
        set((s) => (isMobile() ? { sidebarOpen: !s.sidebarOpen } : { sidebarCollapsed: !s.sidebarCollapsed })),

    closeMobileSidebar: () => set({ sidebarOpen: false }),

    rememberMe: false,
    setRememberMe: (v) => set({ rememberMe: v }),
}));
