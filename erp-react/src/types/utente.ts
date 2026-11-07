// Utente del tenant (membership). Il ruolo è quello della permission
// matrix §5. In produzione utenti e membership vivono nel backend
// (Supabase Auth + tabella membership con RLS): qui sono simulati.

import type { Role } from '../auth/permissions';

export interface Utente {
    id: string;
    name: string;
    email: string;
    role: Role;
    /** Un utente disattivato non può più accedere ma resta negli audit. */
    attivo: boolean;
}

export type UtenteFormValues = Pick<Utente, 'name' | 'email' | 'role'>;
