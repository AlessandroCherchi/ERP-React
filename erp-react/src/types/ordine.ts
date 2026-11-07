// Dominio Ordine di vendita.
// È la prima entità del progetto che non è un'anagrafica: ha una testata,
// delle righe che puntano al magazzino e un ciclo di vita con transizioni
// vincolate. Per questo qui vivono tre cose che le pagine NON devono
// reimplementare: il calcolo dei totali, la macchina degli stati e la
// regola su quando un ordine impegna la giacenza.
//
// TODO(step Backend, spec §2/§9): sostituire con lo schema Postgres/RLS
// reale; oggi è "server state" simulato (vedi lib/mockApi/ordini.ts).

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
 * Transizioni ammesse. Tenerle in tabella invece che sparse negli if
 * dell'interfaccia è ciò che impedisce a un ordine consegnato di tornare
 * in bozza (e quindi di scaricare due volte il magazzino).
 */
const TRANSIZIONI: Record<OrdineStato, OrdineStato[]> = {
    bozza: ['confermato', 'annullato'],
    confermato: ['in-preparazione', 'annullato'],
    'in-preparazione': ['spedito', 'annullato'],
    spedito: ['consegnato'],
    consegnato: [],
    annullato: [],
};

/** Stati raggiungibili da `stato`. Array vuoto = stato terminale. */
export function prossimiStati(stato: OrdineStato): OrdineStato[] {
    return TRANSIZIONI[stato];
}

export function transizioneValida(da: OrdineStato, a: OrdineStato): boolean {
    return TRANSIZIONI[da].includes(a);
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

/** Un ordine è "aperto" finché non è chiuso (consegnato o annullato). */
export function ordineAperto(stato: OrdineStato): boolean {
    return stato !== 'consegnato' && stato !== 'annullato';
}

// ------------------------- RIGHE E TESTATA -------------------------

/**
 * Riga d'ordine. Denormalizza sku/nome/unità/IVA dal prodotto: sono uno
 * snapshot al momento dell'ordine, non un join. Se domani l'articolo viene
 * rinominato o riprezzato, l'ordine già emesso deve continuare a dire cosa
 * è stato venduto e a quanto — è un documento, non una vista.
 */
export interface RigaOrdine {
    prodottoId: number;
    sku: string;
    nome: string;
    unita: string;
    quantita: number;
    /** Prezzo unitario applicato (€), modificabile rispetto al listino. */
    prezzo: number;
    /** Sconto di riga in percentuale (0-100). */
    sconto: number;
    /** Aliquota IVA di riga (%), copiata dall'articolo. */
    iva: number;
}

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

/**
 * Arrotondamento a 2 decimali. Gli importi sono `number` in euro: è la
 * scelta ereditata dal prototipo, non quella definitiva.
 *
 * TODO(spec §10 — Money): passare a minor units (interi in centesimi) con
 * rounding mode esplicito. Finché si resta su float, l'arrotondamento va
 * fatto in un punto solo — qui — e per riga, che è l'ordine di operazioni
 * della prassi fiscale italiana: imponibile di riga arrotondato e poi
 * sommato, non somma di valori grezzi arrotondata alla fine.
 */
function round2(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Imponibile della riga: quantità × prezzo, al netto dello sconto. */
export function imponibileRiga(r: Pick<RigaOrdine, 'quantita' | 'prezzo' | 'sconto'>): number {
    return round2(r.quantita * r.prezzo * (1 - r.sconto / 100));
}

/** IVA della riga, calcolata sull'imponibile già arrotondato. */
export function ivaRiga(r: Pick<RigaOrdine, 'quantita' | 'prezzo' | 'sconto' | 'iva'>): number {
    return round2(imponibileRiga(r) * (r.iva / 100));
}

export interface TotaliOrdine {
    imponibile: number;
    iva: number;
    totale: number;
    /** Pezzi complessivi — il numero che finisce in colonna "Articoli". */
    pezzi: number;
}

/** Totali dell'ordine: sempre ricalcolati, mai persistiti (vedi §10). */
export function totaliOrdine(righe: RigaOrdine[]): TotaliOrdine {
    let imponibile = 0;
    let iva = 0;
    let pezzi = 0;
    for (const r of righe) {
        imponibile += imponibileRiga(r);
        iva += ivaRiga(r);
        pezzi += r.quantita;
    }
    imponibile = round2(imponibile);
    iva = round2(iva);
    return { imponibile, iva, totale: round2(imponibile + iva), pezzi };
}

/**
 * Ordine in ritardo: consegna promessa già scaduta e documento ancora aperto.
 * Derivato dalla data, non da un flag — un flag salvato diventerebbe falso
 * il giorno dopo senza che nessuno lo tocchi.
 */
export function inRitardo(o: Pick<Ordine, 'consegna' | 'stato'>, oggi: string): boolean {
    return Boolean(o.consegna) && o.consegna < oggi && ordineAperto(o.stato);
}

// ------------------------- NUMERAZIONE -------------------------

const NUMERO_BASE = 3000;

/**
 * Suggerisce il prossimo numero d'ordine leggendolo dai documenti esistenti.
 * Stessa logica (e stesso limite) di prossimoSku: Dashboard e pagina Vendite
 * creano ordini nello stesso registro, e due contatori indipendenti
 * finirebbero per assegnare lo stesso numero a documenti diversi.
 *
 * TODO(step Backend): la numerazione passerà al server, unico punto in cui
 * l'unicità è garantita in concorrenza — e per i documenti fiscali è anche
 * un requisito di legge (progressivo senza buchi).
 */
export function prossimoNumeroOrdine(ordini: Pick<Ordine, 'numero'>[]): string {
    const max = ordini.reduce((acc, o) => {
        const n = Number(o.numero.replace(/\D/g, ''));
        return Number.isFinite(n) && n > acc ? n : acc;
    }, NUMERO_BASE);
    return `ORD-${max + 1}`;
}

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
