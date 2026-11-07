// Dominio Cliente — porting 1:1 dei campi usati in clienti.js/dashboard.js.
// TODO(step Backend, spec §2/§9): sostituire con lo schema Postgres/RLS
// reale; per ora è "server state" simulato (vedi lib/mockApi/clienti.ts).

import type { AnagraficaBase, StatoOption } from './anagrafica';

export type ClienteStato = 'attivo' | 'inattivo' | 'prospect';

/** Anagrafica comune (vedi types/anagrafica.ts) + i dati commerciali del cliente. */
export interface Cliente extends AnagraficaBase {
    id: number;
    stato: ClienteStato;
    fatturato: number;
    ordini: number;
    credito: number;
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

/** Campi compilabili dal form (Cliente meno i derivati/generati server-side). */
export type ClienteFormValues = Omit<Cliente, 'id' | 'fatturato' | 'ordini' | 'credito'>;

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
