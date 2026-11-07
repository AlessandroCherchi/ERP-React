// Dominio Cliente — porting 1:1 dei campi usati in clienti.js/dashboard.js.
// TODO(step Backend, spec §2/§9): sostituire con lo schema Postgres/RLS
// reale; per ora è "server state" simulato (vedi lib/mockApi/clienti.ts).

import type { AnagraficaBase, StatoOption } from './anagrafica';

export type ClienteStato = 'attivo' | 'inattivo' | 'prospect';

/**
 * Anagrafica comune (vedi types/anagrafica.ts) + stato commerciale.
 * Fatturato, numero ordini e credito NON sono campi: si derivano da ordini,
 * fatture e incassi (types/statistiche.ts), così non vanno mai fuori sync.
 */
export interface Cliente extends AnagraficaBase {
    id: number;
    stato: ClienteStato;
}

/** Riferimento minimo a un cliente, per le <select> dei documenti. */
export interface ClienteRef {
    id: number;
    nome: string;
}

export const CLIENTE_STATI: StatoOption[] = [
    { value: 'attivo', label: 'Attivo' },
    { value: 'inattivo', label: 'Inattivo' },
    { value: 'prospect', label: 'Prospect' },
];

export const STATO_CLIENTE_LABEL: Record<ClienteStato, string> = {
    attivo: 'Attivo',
    inattivo: 'Inattivo',
    prospect: 'Prospect',
};

/** Campi compilabili dal form (Cliente meno l'id generato server-side). */
export type ClienteFormValues = Omit<Cliente, 'id'>;

export const EMPTY_CLIENTE_FORM: ClienteFormValues = {
    nome: '',
    email: '',
    telefono: '',
    citta: '',
    provincia: '',
    indirizzo: '',
    piva: '',
    cf: '',
    pec: '',
    sdi: '',
    stato: 'attivo',
    note: '',
};
