// Dominio multi-magazzino e inventario fisico.
//
// Modello: ogni articolo ha una giacenza PER MAGAZZINO (`giacenze`); la
// `giacenza` dell'articolo è il totale, mantenuto allineato dall'adapter
// (backend: vista o colonna calcolata). Vendite e acquisti lavorano sul
// magazzino principale salvo indicazione diversa; i trasferimenti spostano
// merce fra magazzini senza cambiare il totale.

import { createStateMachine } from '../lib/stateMachine';

export interface Magazzino {
    id: number;
    codice: string;
    nome: string;
    indirizzo: string;
    /** Magazzino di default per vendite, acquisti e movimenti manuali. */
    principale: boolean;
    attivo: boolean;
}

export type MagazzinoFormValues = Omit<Magazzino, 'id'>;

export const EMPTY_MAGAZZINO_FORM: MagazzinoFormValues = { codice: '', nome: '', indirizzo: '', principale: false, attivo: true };

/** Giacenze per magazzino: chiave = id magazzino (stringa, per la serializzazione JSON). */
export type Giacenze = Record<string, number>;

export function totaleGiacenze(g: Giacenze): number {
    return Object.values(g).reduce((s, q) => s + q, 0);
}

export function giacenzaIn(g: Giacenze, magazzinoId: number): number {
    return g[String(magazzinoId)] ?? 0;
}

/**
 * Applica carico/scarico/rettifica a un magazzino. La rettifica imposta il
 * valore assoluto (conta fisica); nessun magazzino scende sotto zero.
 */
export function applicaInMagazzino(g: Giacenze, magazzinoId: number, tipo: 'carico' | 'scarico' | 'rettifica', quantita: number): Giacenze {
    const attuale = giacenzaIn(g, magazzinoId);
    const nuova = tipo === 'rettifica' ? quantita : tipo === 'carico' ? attuale + quantita : attuale - quantita;
    return { ...g, [String(magazzinoId)]: Math.max(0, nuova) };
}

export class GiacenzaInsufficienteError extends Error {
    readonly disponibile: number;

    constructor(disponibile: number) {
        super(`Quantità non disponibile nel magazzino di origine (disponibili ${disponibile})`);
        this.name = 'GiacenzaInsufficienteError';
        this.disponibile = disponibile;
    }
}

/** Sposta merce fra due magazzini: il totale non cambia. */
export function trasferisci(g: Giacenze, da: number, a: number, quantita: number): Giacenze {
    if (da === a) throw new Error('Origine e destinazione coincidono');
    if (quantita <= 0) throw new Error('Quantità non valida');
    const disp = giacenzaIn(g, da);
    if (quantita > disp) throw new GiacenzaInsufficienteError(disp);
    return { ...g, [String(da)]: disp - quantita, [String(a)]: giacenzaIn(g, a) + quantita };
}

// ------------------------- INVENTARIO FISICO -------------------------

export type ContaStato = 'aperta' | 'chiusa' | 'annullata';

export const STATO_CONTA_LABEL: Record<ContaStato, string> = { aperta: 'In corso', chiusa: 'Chiusa', annullata: 'Annullata' };

export const contaMachine = createStateMachine<ContaStato>({ aperta: ['chiusa', 'annullata'], chiusa: [], annullata: [] });

export interface RigaConta {
    prodottoId: number;
    sku: string;
    nome: string;
    unita: string;
    /** Giacenza a sistema al momento dell'apertura (snapshot). */
    attesa: number;
    /** Quantità contata; null = non ancora contata. */
    contata: number | null;
    /** Costo unitario all'apertura, per valorizzare le differenze. */
    costo: number;
}

export interface ContaInventario {
    id: number;
    numero: string;
    magazzinoId: number;
    /** Categoria merceologica contata ('' = tutte). */
    categoria: string;
    data: string;
    stato: ContaStato;
    righe: RigaConta[];
    note: string;
}

export function differenza(r: RigaConta): number {
    return r.contata == null ? 0 : r.contata - r.attesa;
}

export interface RiepilogoConta {
    righe: number;
    contate: number;
    conDifferenza: number;
    /** Valore netto delle differenze al costo (positivo = eccedenze). */
    valoreDifferenze: number;
}

export function riepilogoConta(c: Pick<ContaInventario, 'righe'>): RiepilogoConta {
    const contate = c.righe.filter((r) => r.contata != null);
    return {
        righe: c.righe.length,
        contate: contate.length,
        conDifferenza: contate.filter((r) => differenza(r) !== 0).length,
        valoreDifferenze: Math.round(contate.reduce((s, r) => s + differenza(r) * r.costo, 0) * 100) / 100,
    };
}
