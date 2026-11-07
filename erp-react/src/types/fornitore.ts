// Dominio Fornitore — stessa anagrafica del Cliente (spec §5: "Clienti/fornitori"
// sono una riga sola della permission matrix) più i dati di fornitura.
//
// TODO(step Backend, spec §2/§9): sostituire con lo schema Postgres/RLS reale;
// oggi è "server state" simulato (vedi lib/mockApi/fornitori.ts).

import type { AnagraficaBase, StatoOption } from './anagrafica';

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

/** Termini di pagamento supportati, condivisi da form e dettaglio. */
export const TERMINI_PAGAMENTO: StatoOption[] = [
    { value: '0', label: 'Pagamento immediato' },
    { value: '30', label: '30 giorni data fattura' },
    { value: '60', label: '60 giorni data fattura' },
    { value: '90', label: '90 giorni data fattura' },
];

/** Etichetta leggibile dei termini di pagamento (fallback: il valore grezzo). */
export function labelPagamento(value: string): string {
    return TERMINI_PAGAMENTO.find((t) => t.value === value)?.label ?? value;
}
