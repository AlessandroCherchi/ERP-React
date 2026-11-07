// Sessione utente — MOCK.
// TODO(step Backend, spec §2): login via Supabase Auth; ruolo e tenant
// derivano dalla membership server-side, mai da ciò che invia il browser.
// L'interfaccia (login/logout/session) resta la stessa.

import { create } from 'zustand';
import { safeStorage } from '../lib/storage';
import type { Role } from './permissions';

export interface SessionUser {
    id: string;
    name: string;
    email: string;
    role: Role;
}

export interface Session {
    user: SessionUser;
    tenantId: string;
    /** ISO timestamp di scadenza. */
    expiresAt: string;
}

/** Utenti demo, uno per ruolo della permission matrix. Password: "demo". */
export const DEMO_USERS: SessionUser[] = [
    { id: 'u-owner', name: 'Olivia Titolare', email: 'owner@demo.it', role: 'owner' },
    { id: 'u-admin', name: 'Andrea Admin', email: 'admin@demo.it', role: 'admin' },
    { id: 'u-acc', name: 'Carla Contabile', email: 'contabilita@demo.it', role: 'accounting' },
    { id: 'u-wh', name: 'Marco Magazzino', email: 'magazzino@demo.it', role: 'warehouse' },
    { id: 'u-view', name: 'Vera Viewer', email: 'viewer@demo.it', role: 'viewer' },
];

const DEMO_PASSWORD = 'demo';
const SESSION_KEY = 'erp.session';
const TTL_REMEMBER_MS = 7 * 24 * 3600 * 1000;
const TTL_SESSION_MS = 8 * 3600 * 1000;

export class AuthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthError';
    }
}

function loadSession(): Session | null {
    const raw = safeStorage.get(SESSION_KEY);
    if (!raw) return null;
    try {
        const s = JSON.parse(raw) as Session;
        if (!s?.user?.role || new Date(s.expiresAt).getTime() < Date.now()) {
            safeStorage.remove(SESSION_KEY);
            return null;
        }
        return s;
    } catch {
        return null;
    }
}

interface AuthState {
    session: Session | null;
    login: (email: string, password: string, opts: { remember: boolean; tenantId: string }) => Promise<Session>;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    session: loadSession(),

    login: async (email, password, { remember, tenantId }) => {
        // latenza simulata: l'interfaccia deve già gestire lo stato "in corso"
        await new Promise((r) => setTimeout(r, 250));
        const user = DEMO_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
        // Messaggio unico per utente e password: non rivelare quali email esistono.
        if (!user || password !== DEMO_PASSWORD) throw new AuthError('Credenziali non valide');

        const session: Session = {
            user,
            tenantId,
            expiresAt: new Date(Date.now() + (remember ? TTL_REMEMBER_MS : TTL_SESSION_MS)).toISOString(),
        };
        safeStorage.set(SESSION_KEY, JSON.stringify(session));
        set({ session });
        return session;
    },

    logout: () => {
        safeStorage.remove(SESSION_KEY);
        set({ session: null });
    },
}));

export function useSession(): Session | null {
    return useAuthStore((s) => s.session);
}

export function getSession(): Session | null {
    return useAuthStore.getState().session;
}
