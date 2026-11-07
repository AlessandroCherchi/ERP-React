// Aggregazioni per Dashboard e Report: funzioni pure sui dati di dominio,
// testabili e indipendenti dalla UI. Gli importi si sommano in centesimi.

import { fromCents, toCents, type Cents } from './money';
import { imponibileRigaCents } from '../types/documento';
import { isNotaCredito, situazione, totaliFattura, type Fattura, type Incasso } from '../types/fattura';
import type { Ordine, OrdineStato } from '../types/ordine';
import { statoProdotto, valoreGiacenza, type Prodotto } from '../types/prodotto';
import type { OrdineAcquisto } from '../types/acquisto';

/** Ultimi `n` mesi (yyyy-mm), dal più vecchio al corrente. */
export function ultimiMesi(n: number, oggi: string): string[] {
    const [y, m] = oggi.split('-').map(Number) as [number, number];
    return Array.from({ length: n }, (_, i) => {
        const d = new Date(y, m - 1 - (n - 1 - i), 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
}

/** Imponibile fatturato per mese (NC a sottrarre) sugli ultimi `n` mesi. */
export function fatturatoMensile(fatture: readonly Fattura[], n: number, oggi: string): { mese: string; valore: number }[] {
    const mesi = ultimiMesi(n, oggi);
    const acc = new Map<string, Cents>(mesi.map((m) => [m, 0 as Cents]));
    for (const f of fatture) {
        const mese = f.data.slice(0, 7);
        if (f.stato !== 'emessa' || !acc.has(mese)) continue;
        const imp = toCents(totaliFattura(f).imponibile);
        acc.set(mese, (acc.get(mese)! + (isNotaCredito(f) ? -imp : imp)) as Cents);
    }
    return mesi.map((mese) => ({ mese, valore: fromCents(acc.get(mese)!) }));
}

export function ordiniPerStato(ordini: readonly Ordine[]): Record<OrdineStato, number> {
    const out: Record<OrdineStato, number> = { bozza: 0, confermato: 0, 'in-preparazione': 0, spedito: 0, consegnato: 0, annullato: 0 };
    for (const o of ordini) out[o.stato]++;
    return out;
}

export interface TopProdotto {
    prodottoId: number;
    nome: string;
    sku: string;
    quantita: number;
    ricavo: number;
}

/** Articoli più venduti (ordini non in bozza né annullati), per ricavo. */
export function topProdotti(ordini: readonly Ordine[], n = 5): TopProdotto[] {
    const acc = new Map<number, { nome: string; sku: string; quantita: number; ricavo: Cents }>();
    for (const o of ordini) {
        if (o.stato === 'bozza' || o.stato === 'annullato') continue;
        for (const r of o.righe) {
            const v = acc.get(r.prodottoId) ?? { nome: r.nome, sku: r.sku, quantita: 0, ricavo: 0 as Cents };
            v.quantita += r.quantita;
            v.ricavo = (v.ricavo + imponibileRigaCents(r)) as Cents;
            acc.set(r.prodottoId, v);
        }
    }
    return [...acc.entries()]
        .map(([prodottoId, v]) => ({ prodottoId, nome: v.nome, sku: v.sku, quantita: v.quantita, ricavo: fromCents(v.ricavo) }))
        .sort((a, b) => b.ricavo - a.ricavo)
        .slice(0, n);
}

/** Clienti per imponibile fatturato (netto NC). */
export function topClienti(fatture: readonly Fattura[], n = 5): { clienteId: number; nome: string; fatturato: number }[] {
    const acc = new Map<number, { nome: string; v: Cents }>();
    for (const f of fatture) {
        if (f.stato !== 'emessa') continue;
        const cur = acc.get(f.clienteId) ?? { nome: f.cliente.nome, v: 0 as Cents };
        const imp = toCents(totaliFattura(f).imponibile);
        cur.v = (cur.v + (isNotaCredito(f) ? -imp : imp)) as Cents;
        acc.set(f.clienteId, cur);
    }
    return [...acc.entries()]
        .map(([clienteId, x]) => ({ clienteId, nome: x.nome, fatturato: fromCents(x.v) }))
        .sort((a, b) => b.fatturato - a.fatturato)
        .slice(0, n);
}

/** Valore di magazzino e conteggi per categoria. */
export function magazzinoPerCategoria(prodotti: readonly Prodotto[]): { categoria: string; articoli: number; valore: number; sottoScorta: number }[] {
    const acc = new Map<string, { articoli: number; valore: Cents; sottoScorta: number }>();
    for (const p of prodotti) {
        const v = acc.get(p.categoria) ?? { articoli: 0, valore: 0 as Cents, sottoScorta: 0 };
        v.articoli++;
        v.valore = (v.valore + toCents(valoreGiacenza(p))) as Cents;
        if (statoProdotto(p) !== 'disponibile') v.sottoScorta++;
        acc.set(p.categoria, v);
    }
    return [...acc.entries()]
        .map(([categoria, v]) => ({ categoria, articoli: v.articoli, valore: fromCents(v.valore), sottoScorta: v.sottoScorta }))
        .sort((a, b) => b.valore - a.valore);
}

/** Valore della merce ricevuta per fornitore (al costo di riga). */
export function acquistiPerFornitore(acquisti: readonly OrdineAcquisto[]): { fornitore: string; ordini: number; ricevuto: number }[] {
    const acc = new Map<string, { ordini: number; ricevuto: Cents }>();
    for (const o of acquisti) {
        if (o.stato === 'bozza' || o.stato === 'annullato') continue;
        const v = acc.get(o.fornitore) ?? { ordini: 0, ricevuto: 0 as Cents };
        v.ordini++;
        for (const r of o.righe) v.ricevuto = (v.ricevuto + imponibileRigaCents({ ...r, quantita: r.ricevuta })) as Cents;
        acc.set(o.fornitore, v);
    }
    return [...acc.entries()]
        .map(([fornitore, v]) => ({ fornitore, ordini: v.ordini, ricevuto: fromCents(v.ricevuto) }))
        .sort((a, b) => b.ricevuto - a.ricevuto);
}

/** Residuo complessivo delle fatture scadute. */
export function creditiScaduti(fatture: readonly Fattura[], incassi: readonly Incasso[], oggi: string): number {
    let tot = 0 as Cents;
    for (const f of fatture) {
        if (f.stato !== 'emessa' || isNotaCredito(f)) continue;
        const s = situazione(f, incassi, fatture, oggi);
        if (s.stato === 'scaduta') tot = (tot + toCents(s.residuo)) as Cents;
    }
    return fromCents(tot);
}
