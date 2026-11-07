// Base anagrafica condivisa fra Clienti e Fornitori.
// La spec v3.1 §5 tratta i due moduli come una riga sola della permission
// matrix ("Clienti/fornitori"): condividono gli stessi campi identificativi
// e fiscali, quindi condividono anche il tipo e il form.

/** Stati comuni a tutte le anagrafiche. Ogni entità può estenderli. */
export type StatoBase = 'attivo' | 'inattivo';

/** Campi identificativi e fiscali comuni a cliente e fornitore. */
export interface AnagraficaBase {
    nome: string;
    email: string;
    telefono: string;
    citta: string;
    provincia: string;
    indirizzo: string;
    piva: string;
    cf: string;
    pec: string;
    sdi: string;
    note: string;
}

/** Valori iniziali dei campi comuni, per il reset dei form. */
export const EMPTY_ANAGRAFICA: AnagraficaBase = {
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
};

/** Opzione di una <select> di stato (label leggibile + valore di dominio). */
export interface StatoOption {
    value: string;
    label: string;
}
