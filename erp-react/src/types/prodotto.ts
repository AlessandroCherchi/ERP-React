// Dominio Prodotto / Magazzino.
// Anagrafica articolo, stato di scorta derivato, movimenti di magazzino.
//
// TODO(step Backend, spec §2/§9): sostituire con lo schema
// Postgres/RLS reale; oggi è "server state" simulato
// (vedi lib/mockApi/inventario.ts).

import type { Giacenze } from './magazzino';

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
    /** Fornitore abituale (id anagrafica fornitori); null = nessuno. */
    fornitoreId: number | null;
    /** Costo d'acquisto unitario (€). Base per la valorizzazione di magazzino. */
    costo: number;
    /** Prezzo di vendita unitario (€). */
    prezzo: number;
    /** Quantità totale disponibile (somma delle giacenze per magazzino). */
    giacenza: number;
    /** Giacenza per magazzino (types/magazzino.ts). */
    giacenze: Giacenze;
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

// Codici SKU: config/numbering.ts → nextNumber(config.numbering.sku, …).
// Il prefisso e il progressivo sono configurabili per tenant.

// ------------------------- MOVIMENTI -------------------------

/**
 * Tipo di movimento di magazzino.
 * - carico:        merce in ingresso (+)
 * - scarico:       merce in uscita (−)
 * - rettifica:     allineamento all'inventario fisico (valore assoluto)
 * - trasferimento: spostamento fra magazzini (totale invariato; solo di sistema)
 */
export type MovimentoTipo = 'carico' | 'scarico' | 'rettifica' | 'trasferimento';

/** Tipi registrabili a mano dal modale movimento. */
export type MovimentoManuale = Exclude<MovimentoTipo, 'trasferimento'>;

export interface Movimento {
    id: number;
    prodottoId: number;
    tipo: MovimentoTipo;
    /** Quantità sempre positiva: è `tipo` a determinare il segno. */
    quantita: number;
    causale: string;
    /** Data ISO (yyyy-mm-dd). */
    data: string;
    /** Giacenza totale risultante dopo il movimento — traccia di audit. */
    giacenzaFinale: number;
    /** Magazzino interessato (origine, per i trasferimenti). */
    magazzinoId: number;
    /** Magazzino di destinazione (solo trasferimenti). */
    magazzinoDestId?: number;
    note: string;
    /**
     * Ordine di vendita che ha generato il movimento, se ne esiste uno.
     * Serve a rispondere a "questo ordine ha già scaricato?" senza dedurlo
     * dal testo della causale: è l'unica traccia affidabile per non
     * scaricare due volte e per stornare l'esatta quantità in annullamento.
     */
    ordineId?: number;
    /** Ordine d'acquisto che ha generato il carico (ricevimento merce). */
    acquistoId?: number;
}

export const MOVIMENTO_LABEL: Record<MovimentoTipo, string> = {
    carico: 'Carico',
    scarico: 'Scarico',
    rettifica: 'Rettifica',
    trasferimento: 'Trasferimento',
};

/**
 * Applica un movimento a una giacenza e restituisce la nuova quantità.
 * Unico punto in cui si decide il segno: usato sia dalla mock API sia
 * dall'anteprima live del modale, così non possono divergere.
 * La giacenza non scende mai sotto zero.
 */
export function applicaMovimento(giacenza: number, tipo: MovimentoTipo, quantita: number): number {
    if (tipo === 'trasferimento') return giacenza;
    if (tipo === 'rettifica') return Math.max(0, quantita);
    const delta = tipo === 'carico' ? quantita : -quantita;
    return Math.max(0, giacenza + delta);
}

// ------------------------- FORM -------------------------

/**
 * Campi del prodotto, condivisi fra la quick action "Aggiungi Prodotto"
 * della Dashboard e il CRUD della pagina Inventario (stesso modale in
 * entrambi i posti — vedi components/inventario/ProdottoFormFields).
 */
export interface ProdottoForm {
    nome: string;
    sku: string;
    categoria: string;
    /** Id del fornitore come stringa ('' = nessuno): valore della <select>. */
    fornitoreId: string;
    costo: string;
    prezzo: string;
    giacenza: string;
    scorta: string;
    unita: string;
    iva: string;
    /** Posizione a magazzino, es. "A-12-3". */
    ubicazione: string;
    descrizione: string;
}

export const EMPTY_PRODOTTO: ProdottoForm = {
    nome: '', sku: '', categoria: '', fornitoreId: '',
    costo: '', prezzo: '', giacenza: '', scorta: '', unita: 'pz', iva: '22',
    ubicazione: '', descrizione: '',
};


// Categorie, unità e aliquote sono tabelle del tenant: config → tables.

/** Valori del form movimento (string: parsing con parseNum al salvataggio). */
export interface MovimentoFormValues {
    tipo: MovimentoManuale;
    /** Id magazzino come stringa (valore della <select>). */
    magazzinoId: string;
    quantita: string;
    causale: string;
    data: string;
    note: string;
}
