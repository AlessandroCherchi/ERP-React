// Permission matrix — Implementation Contract v3.1 §5.
// La UI usa questa tabella per NASCONDERE azioni; l'autorizzazione reale
// resta del backend (RLS/RPC), che deve rifiutare comunque. Ogni cella è
// coperta da un test (permissions.test.ts).
//
// Celle che la spec lascia da definire, qui fissate e documentate:
// - "Read propria" (Accounting su Organizzazione) → read: il filtro
//   "propria" è sui dati, lo applica il backend per membership.
// - "Limitato" (Warehouse su Ordini) → read + update: il magazzino avanza
//   lo stato operativo (preparazione/spedizione) ma non crea né elimina
//   documenti commerciali. Il dettaglio per transizione è in canTransition().

export const ROLES = ['owner', 'admin', 'accounting', 'warehouse', 'viewer'] as const;
export type Role = (typeof ROLES)[number];

export const RESOURCES = [
    'organizzazione', // organizzazione e membri
    'anagrafiche',    // clienti e fornitori
    'magazzino',      // prodotti, movimenti
    'ordini',         // ordini di vendita/acquisto
    'fatture',        // bozze fattura
    'sdi',            // validazione e invio SDI
    'audit',
    'impostazioni',   // impostazioni e provider
] as const;
export type Resource = (typeof RESOURCES)[number];

export type Action = 'read' | 'create' | 'update' | 'delete' | 'export' | 'submit';

const CRUD: Action[] = ['read', 'create', 'update', 'delete', 'export'];
const READ: Action[] = ['read'];
const NONE: Action[] = [];

export const PERMISSIONS: Record<Role, Record<Resource, Action[]>> = {
    owner: {
        organizzazione: CRUD, anagrafiche: CRUD, magazzino: CRUD, ordini: CRUD,
        fatture: CRUD, sdi: ['read', 'submit'], audit: ['read', 'export'], impostazioni: CRUD,
    },
    admin: {
        organizzazione: CRUD, anagrafiche: CRUD, magazzino: ['read', 'export'], ordini: CRUD,
        fatture: CRUD, sdi: ['read', 'submit'], audit: ['read', 'export'], impostazioni: CRUD,
    },
    accounting: {
        organizzazione: READ, anagrafiche: CRUD, magazzino: CRUD, ordini: CRUD,
        fatture: CRUD, sdi: ['read', 'submit'], audit: READ, impostazioni: NONE,
    },
    warehouse: {
        organizzazione: NONE, anagrafiche: READ, magazzino: CRUD, ordini: ['read', 'update'],
        fatture: READ, sdi: NONE, audit: NONE, impostazioni: NONE,
    },
    viewer: {
        organizzazione: NONE, anagrafiche: READ, magazzino: READ, ordini: READ,
        fatture: READ, sdi: NONE, audit: NONE, impostazioni: NONE,
    },
};

export function can(role: Role | null | undefined, resource: Resource, action: Action): boolean {
    if (!role) return false;
    return PERMISSIONS[role][resource].includes(action);
}

/**
 * Transizioni d'ordine consentite al ruolo. Il magazzino ("Limitato")
 * gestisce solo l'avanzamento fisico; conferma e annullamento hanno
 * effetti commerciali e restano a chi crea i documenti.
 */
const TRANSIZIONI_MAGAZZINO = new Set(['in-preparazione', 'spedito', 'consegnato']);

export function canTransition(role: Role | null | undefined, verso: string): boolean {
    if (!role) return false;
    if (role === 'warehouse') return TRANSIZIONI_MAGAZZINO.has(verso);
    return can(role, 'ordini', 'update');
}
