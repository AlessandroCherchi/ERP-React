// Dominio Prodotto / Magazzino.
// Estende i campi del modale "Aggiungi Prodotto" della Dashboard
// (types/quickActions.ts → ProdottoForm) con i dati anagrafici
// persistiti: id, ubicazione e storico movimenti.
//
// TODO(step Backend, spec §2/§9): sostituire con lo schema
// Postgres/RLS reale; oggi è "server state" simulato
// (vedi lib/mockApi/inventario.ts).

/**
 * Stato di magazzino: NON è un campo persistito ma una funzione pura di
 * (giacenza, scorta). Tenerlo derivato evita che il flag vada fuori sync
 * con la quantità reale dopo un carico/scarico — errore classico in ERP.
 */
export type ProdottoStato = 'disponibile' | 'sotto-scorta' | 'esaurito';

export interface Prodotto {
    id: number;
    sku: string;
    nome: string;
    categoria: string;
    fornitore: string;
    /** Costo d'acquisto unitario (€). Base per la valorizzazione di magazzino. */
    costo: number;
    /** Prezzo di vendita unitario (€). */
    prezzo: number;
    /** Quantità attualmente disponibile. */
    giacenza: number;
    /** Soglia di riordino: sotto o pari a questa si è "sotto scorta". */
    scorta: number;
    /** Unità di misura: pz | cf | kg | m | lt. */
    unita: string;
    /** Aliquota IVA (%). */
    iva: number;
    /** Posizione a magazzino, es. "A-12-3" (corsia-scaffale-ripiano). */
    ubicazione: string;
    descrizione: string;
}

/** Calcola lo stato di magazzino a partire da giacenza e scorta minima. */
export function statoProdotto(p: Pick<Prodotto, 'giacenza' | 'scorta'>): ProdottoStato {
    if (p.giacenza <= 0) return 'esaurito';
    if (p.giacenza <= p.scorta) return 'sotto-scorta';
    return 'disponibile';
}

/** Etichetta leggibile dello stato (per badge, export CSV, dettaglio). */
export const STATO_LABEL: Record<ProdottoStato, string> = {
    disponibile: 'Disponibile',
    'sotto-scorta': 'Sotto scorta',
    esaurito: 'Esaurito',
};

/** Valore di magazzino della riga: giacenza × costo d'acquisto. */
export function valoreGiacenza(p: Pick<Prodotto, 'giacenza' | 'costo'>): number {
    return p.giacenza * p.costo;
}

/** Margine unitario: prezzo di vendita − costo d'acquisto. */
export function margineUnitario(p: Pick<Prodotto, 'prezzo' | 'costo'>): number {
    return p.prezzo - p.costo;
}

/** Primo SKU dopo quelli già assegnati. */
const SKU_BASE = 4500;

/**
 * Suggerisce il prossimo codice SKU libero leggendolo dal catalogo reale.
 * Va derivato dai dati e non da un contatore locale di pagina: Dashboard e
 * Inventario creano articoli nello stesso magazzino, e due contatori
 * indipendenti finirebbero per assegnare lo stesso SKU a prodotti diversi.
 *
 * TODO(step Backend): la generazione del codice passerà al server, che è
 * l'unico punto in cui può essere garantita l'unicità in concorrenza.
 */
export function prossimoSku(prodotti: Prodotto[]): string {
    const max = prodotti.reduce((acc, p) => {
        const n = Number(p.sku.replace(/\D/g, ''));
        return Number.isFinite(n) && n > acc ? n : acc;
    }, SKU_BASE);
    return `SKU-${max + 1}`;
}

// ------------------------- MOVIMENTI -------------------------

/**
 * Tipo di movimento di magazzino.
 * - carico:    merce in ingresso (+)
 * - scarico:   merce in uscita (−)
 * - rettifica: allineamento all'inventario fisico (valore assoluto)
 */
export type MovimentoTipo = 'carico' | 'scarico' | 'rettifica';

export interface Movimento {
    id: number;
    prodottoId: number;
    tipo: MovimentoTipo;
    /** Quantità sempre positiva: è `tipo` a determinare il segno. */
    quantita: number;
    causale: string;
    /** Data ISO (yyyy-mm-dd). */
    data: string;
    /** Giacenza risultante dopo il movimento — traccia di audit. */
    giacenzaFinale: number;
    note: string;
    /**
     * Ordine di vendita che ha generato il movimento, se ne esiste uno.
     * Serve a rispondere a "questo ordine ha già scaricato?" senza dedurlo
     * dal testo della causale: è l'unica traccia affidabile per non
     * scaricare due volte e per stornare l'esatta quantità in annullamento.
     */
    ordineId?: number;
}

export const MOVIMENTO_LABEL: Record<MovimentoTipo, string> = {
    carico: 'Carico',
    scarico: 'Scarico',
    rettifica: 'Rettifica',
};

/**
 * Applica un movimento a una giacenza e restituisce la nuova quantità.
 * Unico punto in cui si decide il segno: usato sia dalla mock API sia
 * dall'anteprima live del modale, così non possono divergere.
 * La giacenza non scende mai sotto zero.
 */
export function applicaMovimento(giacenza: number, tipo: MovimentoTipo, quantita: number): number {
    if (tipo === 'rettifica') return Math.max(0, quantita);
    const delta = tipo === 'carico' ? quantita : -quantita;
    return Math.max(0, giacenza + delta);
}

// ------------------------- FORM -------------------------

/** Categorie merceologiche gestite (allineate al modale Dashboard). */
export const CATEGORIE = ['Elettronica', 'Componenti', 'Illuminazione', 'Networking', 'Accessori'] as const;

/** Valori del form movimento (string: parsing con parseNum al salvataggio). */
export interface MovimentoFormValues {
    tipo: MovimentoTipo;
    quantita: string;
    causale: string;
    data: string;
    note: string;
}
