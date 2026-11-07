// Mock utenti del tenant. TODO(step Backend): Supabase Auth + membership;
// invito via email con link, mai password scelte dall'amministratore.

import type { Utente, UtenteFormValues } from '../../types/utente';
import { collection, delay } from './db';

/** Utenti demo, uno per ruolo. Password di tutti: "demo". */
export const DEMO_USERS: Utente[] = [
    { id: 'u-owner', name: 'Olivia Titolare', email: 'owner@demo.it', role: 'owner', attivo: true },
    { id: 'u-admin', name: 'Andrea Admin', email: 'admin@demo.it', role: 'admin', attivo: true },
    { id: 'u-acc', name: 'Carla Contabile', email: 'contabilita@demo.it', role: 'accounting', attivo: true },
    { id: 'u-wh', name: 'Marco Magazzino', email: 'magazzino@demo.it', role: 'warehouse', attivo: true },
    { id: 'u-view', name: 'Vera Viewer', email: 'viewer@demo.it', role: 'viewer', attivo: true },
];

export const DEMO_PASSWORD = 'demo';

const store = collection('utenti', DEMO_USERS);

export class UtenteError extends Error {}

const sameEmail = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Verifica sincrona delle credenziali (mock): utente esistente, attivo, password demo. */
export function verificaCredenziali(email: string, password: string): Utente | null {
    const u = store.find((x) => sameEmail(x.email, email));
    return u && u.attivo && password === DEMO_PASSWORD ? { ...u } : null;
}

export async function fetchUtenti(): Promise<Utente[]> {
    await delay();
    return store.map((u) => ({ ...u }));
}

export async function invitaUtente(data: UtenteFormValues): Promise<Utente> {
    await delay();
    if (store.some((u) => sameEmail(u.email, data.email))) throw new UtenteError('Esiste già un utente con questa email');
    const utente: Utente = { ...data, email: data.email.trim(), id: `u-${crypto.randomUUID().slice(0, 8)}`, attivo: true };
    store.push(utente);
    return { ...utente };
}

/**
 * Aggiorna ruolo/dati. Regola di sicurezza: deve restare almeno un owner
 * attivo, altrimenti nessuno potrebbe più amministrare il tenant.
 */
export async function aggiornaUtente(id: string, patch: Partial<Pick<Utente, 'name' | 'role' | 'attivo'>>): Promise<Utente> {
    await delay();
    const idx = store.findIndex((u) => u.id === id);
    if (idx === -1) throw new UtenteError('Utente non trovato');
    const next = { ...store[idx]!, ...patch };
    const ownerAttivi = store.filter((u) => u.role === 'owner' && u.attivo && u.id !== id).length + (next.role === 'owner' && next.attivo ? 1 : 0);
    if (ownerAttivi === 0) throw new UtenteError('Deve restare almeno un titolare attivo');
    store[idx] = next;
    return { ...next };
}
