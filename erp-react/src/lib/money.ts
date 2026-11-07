// Importi in centesimi interi — Implementation Contract v3.1 §10.
//
// Scelta esplicita: base unit = centesimi (integer minor units), valuta a
// due decimali. Tutta l'aritmetica dei documenti (righe, riepiloghi IVA,
// totali) avviene in centesimi interi; si converte in euro solo per la
// visualizzazione. Rounding mode: half-up ("arrotondamento commerciale"),
// applicato a ogni riga e a ogni imposta per aliquota.
//
// JavaScript Number resta il contenitore, ma i valori sono sempre interi
// sicuri (< 2^53): niente derive da somme di decimali binari.
// I valori di riferimento sono in money.test.ts (golden test, da condividere
// con il backend — spec AC-MONEY-01).

declare const centsBrand: unique symbol;
/** Importo in centesimi interi. Il brand impedisce di mescolarlo con gli euro. */
export type Cents = number & { readonly [centsBrand]: true };

/**
 * Normalizza l'errore di rappresentazione binaria prima di arrotondare
 * (1.005 * 100 = 100.49999999999999 → 100.5).
 */
function normalize(x: number): number {
    return Math.round(x * 1e6) / 1e6;
}

/** Arrotondamento half-up all'intero (simmetrico sui negativi: -2.5 → -3). */
export function roundHalfUp(x: number): number {
    const n = normalize(x);
    return Math.sign(n) * Math.floor(Math.abs(n) + 0.5);
}

export function cents(n: number): Cents {
    return roundHalfUp(n) as Cents;
}

/** Euro (anche con più decimali, es. prezzo unitario) → centesimi. */
export function toCents(euro: number): Cents {
    return cents(euro * 100);
}

/** Centesimi → euro, per visualizzazione ed export. */
export function fromCents(c: Cents): number {
    return c / 100;
}

export function sumCents(values: readonly Cents[]): Cents {
    return values.reduce((a, b) => a + b, 0) as Cents;
}

/** Applica una percentuale (aliquota, sconto) con arrotondamento half-up. */
export function percentOf(c: Cents, percent: number): Cents {
    return cents((c * percent) / 100);
}
