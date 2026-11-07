// Righe e totali dei documenti commerciali (ordini di vendita, ordini
// d'acquisto, DDT, fatture): stessa forma e stessa aritmetica ovunque.
//
// Regole di calcolo (allineate a FatturaPA, blocco DatiRiepilogo):
// 1. imponibile di riga = quantità × prezzo × (1 − sconto%), arrotondato
//    al centesimo (half-up);
// 2. l'IVA NON si calcola riga per riga: si raggruppano gli imponibili per
//    aliquota e l'imposta si calcola una volta per aliquota;
// 3. totale = Σ imponibili + Σ imposte.
// Tutto in centesimi interi (lib/money.ts); i totali escono in euro.

import { cents, fromCents, percentOf, sumCents, toCents, type Cents } from '../lib/money';

/**
 * Riga di documento. Denormalizza sku/nome/unità/IVA dall'articolo: sono
 * uno snapshot al momento dell'emissione, non un join. Se l'articolo viene
 * rinominato o riprezzato, il documento continua a dire cosa riportava.
 */
export interface RigaDocumento {
    prodottoId: number;
    sku: string;
    nome: string;
    unita: string;
    quantita: number;
    /** Prezzo unitario applicato (€), modificabile rispetto al listino. */
    prezzo: number;
    /** Sconto di riga in percentuale (0-100). */
    sconto: number;
    /** Aliquota IVA di riga (%). */
    iva: number;
}

type RigaCalcolo = Pick<RigaDocumento, 'quantita' | 'prezzo' | 'sconto'>;

/** Imponibile di riga in centesimi. */
export function imponibileRigaCents(r: RigaCalcolo): Cents {
    return cents(r.quantita * toCents(r.prezzo) * (1 - r.sconto / 100));
}

/** Imponibile di riga in euro. */
export function imponibileRiga(r: RigaCalcolo): number {
    return fromCents(imponibileRigaCents(r));
}

/** IVA "teorica" della singola riga (solo informativa: il totale usa il riepilogo). */
export function ivaRiga(r: RigaCalcolo & Pick<RigaDocumento, 'iva'>): number {
    return fromCents(percentOf(imponibileRigaCents(r), r.iva));
}

export interface RiepilogoIva {
    aliquota: number;
    imponibile: number;
    imposta: number;
}

/** Riepilogo per aliquota (ordinato per aliquota decrescente, come in fattura). */
export function riepilogoIva(righe: readonly RigaDocumento[]): RiepilogoIva[] {
    const perAliquota = new Map<number, Cents[]>();
    for (const r of righe) {
        const list = perAliquota.get(r.iva) ?? [];
        list.push(imponibileRigaCents(r));
        perAliquota.set(r.iva, list);
    }
    return [...perAliquota.entries()]
        .sort(([a], [b]) => b - a)
        .map(([aliquota, imponibili]) => {
            const imponibile = sumCents(imponibili);
            return { aliquota, imponibile: fromCents(imponibile), imposta: fromCents(percentOf(imponibile, aliquota)) };
        });
}

export interface TotaliDocumento {
    imponibile: number;
    iva: number;
    totale: number;
    /** Quantità complessiva (colonna "Articoli"). */
    pezzi: number;
}

/** Totali del documento: sempre ricalcolati dalle righe, mai persistiti. */
export function totaliDocumento(righe: readonly RigaDocumento[]): TotaliDocumento {
    const riepilogo = riepilogoIva(righe);
    const imponibile = sumCents(riepilogo.map((x) => toCents(x.imponibile)));
    const iva = sumCents(riepilogo.map((x) => toCents(x.imposta)));
    return {
        imponibile: fromCents(imponibile),
        iva: fromCents(iva),
        totale: fromCents((imponibile + iva) as Cents),
        pezzi: righe.reduce((s, r) => s + r.quantita, 0),
    };
}
