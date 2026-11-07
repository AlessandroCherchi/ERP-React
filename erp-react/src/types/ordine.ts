// Dominio Ordine di vendita.
// È la prima entità del progetto che non è un'anagrafica: ha una testata,
// delle righe che puntano al magazzino e un ciclo di vita con transizioni
// vincolate. Per questo qui vivono tre cose che le pagine NON devono
// reimplementare: il calcolo dei totali, la macchina degli stati e la
// regola su quando un ordine impegna la giacenza.
//
// TODO(step Backend, spec §2/§9): sostituire con lo schema Postgres/RLS
// reale; oggi è "server state" simulato (vedi lib/mockApi/ordini.ts).

import { createStateMachine } from '../lib/stateMachine';
import { totaliDocumento, type RigaDocumento, type TotaliDocumento } from './documento';

// ------------------------- STATI -------------------------

/**
 * Ciclo di vita dell'ordine.
 * - bozza:           in compilazione, nessun effetto sul magazzino
 * - confermato:      accettato dal cliente, la merce è scaricata
 * - in-preparazione: in allestimento
 * - spedito:         partito dal magazzino
 * - consegnato:      chiuso positivamente (terminale)
 * - annullato:       chiuso negativamente (terminale), la merce rientra
 */
export type OrdineStato =
    | 'bozza' | 'confermato' | 'in-preparazione' | 'spedito' | 'consegnato' | 'annullato';

export type OrdinePriorita = 'bassa' | 'normale' | 'alta' | 'urgente';

export const STATO_ORDINE_LABEL: Record<OrdineStato, string> = {
    bozza: 'Bozza',
    confermato: 'Confermato',
    'in-preparazione': 'In preparazione',
    spedito: 'Spedito',
    consegnato: 'Consegnato',
    annullato: 'Annullato',
};

export const PRIORITA_LABEL: Record<OrdinePriorita, string> = {
    bassa: 'Bassa',
    normale: 'Normale',
    alta: 'Alta',
    urgente: 'Urgente',
};

/**
 * Transizioni ammesse (vedi lib/stateMachine.ts): un consegnato non torna
 * indietro, uno spedito non si annulla (la merce è già partita).
 */
export const ordineMachine = createStateMachine<OrdineStato>({
    bozza: ['confermato', 'annullato'],
    confermato: ['in-preparazione', 'annullato'],
    'in-preparazione': ['spedito', 'annullato'],
    spedito: ['consegnato'],
    consegnato: [],
    annullato: [],
});

/** Stati raggiungibili da `stato`. Array vuoto = stato terminale. */
export function prossimiStati(stato: OrdineStato): readonly OrdineStato[] {
    return ordineMachine.next(stato);
}

export function transizioneValida(da: OrdineStato, a: OrdineStato): boolean {
    return ordineMachine.canTransition(da, a);
}

/**
 * Stati in cui la merce dell'ordine è già uscita dal magazzino.
 * Unico punto in cui questa regola è scritta: la mock API la usa per
 * decidere se scaricare o stornare, l'interfaccia per spiegarlo all'utente.
 */
const STATI_IMPEGNATIVI: OrdineStato[] = ['confermato', 'in-preparazione', 'spedito', 'consegnato'];

export function impegnaMagazzino(stato: OrdineStato): boolean {
    return STATI_IMPEGNATIVI.includes(stato);
}

/**
 * Raggruppamento degli stati usato dai filtri d'elenco. "In corso" copre i
 * tre stati intermedi: all'operatore interessa distinguere ciò che è ancora
 * da lavorare da ciò che è chiuso, e cinque filtri separati per il ciclo di
 * vita sarebbero solo rumore — lo stato puntuale resta nel badge di riga.
 */
export type StatoFilter = 'all' | 'bozza' | 'in-corso' | 'consegnato' | 'annullato';

export const STATI_FILTRO: Record<Exclude<StatoFilter, 'all'>, OrdineStato[]> = {
    bozza: ['bozza'],
    'in-corso': ['confermato', 'in-preparazione', 'spedito'],
    consegnato: ['consegnato'],
    annullato: ['annullato'],
};

/**
 * Il contenuto (righe, cliente) si modifica solo in bozza: cambiarlo dopo la
 * conferma scollegherebbe il documento dai movimenti che ha generato.
 */
export function ordineModificabile(stato: OrdineStato): boolean {
    return stato === 'bozza';
}

/** Si eliminano solo bozze e annullati: un ordine che ha movimentato resta agli atti. */
export function ordineEliminabile(stato: OrdineStato): boolean {
    return stato === 'bozza' || stato === 'annullato';
}

/** Un ordine è "aperto" finché non è chiuso (consegnato o annullato). */
export function ordineAperto(stato: OrdineStato): boolean {
    return stato !== 'consegnato' && stato !== 'annullato';
}

// ------------------------- RIGHE E TESTATA -------------------------

/** Riga d'ordine di vendita: la riga di documento comune (types/documento.ts). */
export type RigaOrdine = RigaDocumento;

export interface Ordine {
    id: number;
    /** Numero documento, es. "ORD-3093". */
    numero: string;
    clienteId: number;
    /** Ragione sociale al momento dell'ordine (snapshot, come le righe). */
    cliente: string;
    /** Data ordine (ISO yyyy-mm-dd). */
    data: string;
    /** Consegna prevista (ISO), '' se non concordata. */
    consegna: string;
    stato: OrdineStato;
    priorita: OrdinePriorita;
    righe: RigaOrdine[];
    note: string;
}

// ------------------------- TOTALI (DERIVATI) -------------------------
// Aritmetica in centesimi e riepilogo IVA per aliquota: types/documento.ts.

export { imponibileRiga, ivaRiga, riepilogoIva } from './documento';
export type TotaliOrdine = TotaliDocumento;
export const totaliOrdine = totaliDocumento;

/**
 * Ordine in ritardo: consegna promessa già scaduta e documento ancora aperto.
 * Derivato dalla data, non da un flag — un flag salvato diventerebbe falso
 * il giorno dopo senza che nessuno lo tocchi.
 */
export function inRitardo(o: Pick<Ordine, 'consegna' | 'stato'>, oggi: string): boolean {
    return Boolean(o.consegna) && o.consegna < oggi && ordineAperto(o.stato);
}

// ------------------------- NUMERAZIONE -------------------------
// config/numbering.ts → nextNumber(config.numbering.ordine, …): prefisso e
// progressivo per tenant. Numerazione definitiva: backend (spec §2).

// ------------------------- FORM -------------------------

/**
 * Valori del form ordine. A differenza degli altri form del progetto i
 * numerici non sono string: le righe non nascono da <input> liberi ma da un
 * editor dedicato che parte dall'articolo di magazzino, quindi il parsing
 * avviene lì, una volta sola.
 */
export interface OrdineFormValues {
    numero: string;
    clienteId: number;
    data: string;
    consegna: string;
    priorita: OrdinePriorita;
    righe: RigaOrdine[];
    note: string;
}

export const EMPTY_ORDINE_FORM: OrdineFormValues = {
    numero: '',
    clienteId: 0,
    data: '',
    consegna: '',
    priorita: 'normale',
    righe: [],
    note: '',
};

export const PRIORITA_OPTIONS: { value: OrdinePriorita; label: string }[] = [
    { value: 'bassa', label: 'Bassa' },
    { value: 'normale', label: 'Normale' },
    { value: 'alta', label: 'Alta' },
    { value: 'urgente', label: 'Urgente' },
];
