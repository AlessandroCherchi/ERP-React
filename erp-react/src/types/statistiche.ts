// Indicatori commerciali derivati dai documenti (mai persistiti).

import { isNotaCredito, situazione, totaliFattura, type Fattura, type Incasso } from './fattura';
import { fromCents, toCents, type Cents } from '../lib/money';
import type { Ordine } from './ordine';

export interface StatisticheCliente {
    /** Imponibile fatturato al netto delle note di credito. */
    fatturato: number;
    /** Ordini non annullati. */
    ordini: number;
    /** Residuo da incassare sulle fatture emesse. */
    credito: number;
}

const ZERO: StatisticheCliente = { fatturato: 0, ordini: 0, credito: 0 };

export function statisticheClienti(
    ordini: readonly Ordine[],
    fatture: readonly Fattura[],
    incassi: readonly Incasso[],
    oggi: string
): (clienteId: number) => StatisticheCliente {
    const acc = new Map<number, { fatturato: Cents; ordini: number; credito: Cents }>();
    const get = (id: number) => {
        let v = acc.get(id);
        if (!v) acc.set(id, (v = { fatturato: 0 as Cents, ordini: 0, credito: 0 as Cents }));
        return v;
    };
    for (const o of ordini) if (o.stato !== 'annullato') get(o.clienteId).ordini++;
    for (const f of fatture) {
        if (f.stato !== 'emessa') continue;
        const v = get(f.clienteId);
        const imp = toCents(totaliFattura(f).imponibile);
        v.fatturato = (v.fatturato + (isNotaCredito(f) ? -imp : imp)) as Cents;
        if (!isNotaCredito(f)) v.credito = (v.credito + toCents(situazione(f, incassi, fatture, oggi).residuo)) as Cents;
    }
    return (id) => {
        const v = acc.get(id);
        return v ? { fatturato: fromCents(v.fatturato), ordini: v.ordini, credito: fromCents(v.credito) } : ZERO;
    };
}
