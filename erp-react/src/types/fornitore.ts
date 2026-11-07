// Dominio Fornitore — stessa anagrafica del Cliente (spec §5: "Clienti/fornitori"
// sono una riga sola della permission matrix) più i dati di fornitura.
//
// TODO(step Backend, spec §2/§9): sostituire con lo schema Postgres/RLS reale;
// oggi è "server state" simulato (vedi lib/mockApi/fornitori.ts).

import type { AnagraficaBase, StatoOption } from './anagrafica';
import { getConfig } from '../config/configStore';

/** 'sospeso' = rapporto temporaneamente bloccato (contenzioso, qualità, insoluti). */
export type FornitoreStato = 'attivo' | 'inattivo' | 'sospeso';

export interface Fornitore extends AnagraficaBase {
    id: number;
    stato: FornitoreStato;
    /** Categoria merceologica fornita — allineata alle categorie di magazzino. */
    categoria: string;
    /** Termini di pagamento concordati, in giorni ('0' = immediato). */
    pagamento: string;
    /** Tempo di consegna medio dichiarato, in giorni. */
    leadTime: number;
    iban: string;
    /** Totale acquistato dal fornitore (€) — derivato server-side. */
    acquistato: number;
    /** Numero di ordini di acquisto emessi — derivato server-side. */
    ordini: number;
    /** Esposizione debitoria corrente verso il fornitore (€). */
    debito: number;
}

/** Riferimento minimo per select e lookup (include gli inattivi: servono a risolvere i nomi). */
export interface FornitoreRef {
    id: number;
    nome: string;
    attivo: boolean;
}

/** Campi compilabili dal form (Fornitore meno id e derivati server-side). */
export type FornitoreFormValues = Omit<Fornitore, 'id' | 'acquistato' | 'ordini' | 'debito'>;

export const EMPTY_FORNITORE_FORM: FornitoreFormValues = {
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
    note: '',
    stato: 'attivo',
    categoria: 'Componenti',
    pagamento: '30',
    leadTime: 0,
    iban: '',
};

export const FORNITORE_STATI: StatoOption[] = [
    { value: 'attivo', label: 'Attivo' },
    { value: 'inattivo', label: 'Inattivo' },
    { value: 'sospeso', label: 'Sospeso' },
];

export const STATO_FORNITORE_LABEL: Record<FornitoreStato, string> = {
    attivo: 'Attivo',
    inattivo: 'Inattivo',
    sospeso: 'Sospeso',
};

/**
 * Etichetta leggibile dei termini di pagamento dalla tabella del tenant
 * (fallback: il valore grezzo). Non è un hook: legge il config corrente.
 */
export function labelPagamento(value: string): string {
    return getConfig().tables.terminiPagamento.find((t) => t.value === value)?.label ?? value;
}
