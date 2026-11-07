import type { it } from './it';

/** Forma del dizionario: stesse chiavi dell'italiano, valori stringa. */
type DeepString<T> = { [K in keyof T]: T[K] extends string ? string : DeepString<T[K]> };
export type Dictionary = DeepString<typeof it>;

/** Percorsi "a.b.c" delle foglie del dizionario. */
type Paths<T, P extends string = ''> = {
    [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Paths<T[K], `${P}${K}.`>;
}[keyof T & string];

export type TKey = Paths<Dictionary>;
