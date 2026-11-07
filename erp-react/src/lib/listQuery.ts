// Pipeline delle pagine elenco: filtri → ricerca → ordinamento → pagina.
// Funzione pura, indipendente da React e dalla UI: la stessa logica serve
// alle tabelle, agli export CSV (che esportano il filtrato, non la pagina)
// e ai test. Sostituisce i blocchi useMemo duplicati nelle pagine.

import { matchesQuery, paginate, sortRows, type PageSlice, type SortDir } from './tableUtils';

export interface ListQuery<T, K extends string> {
    /** Predicati di filtro già risolti (ognuno deve essere vero). */
    filters?: Array<(row: T) => boolean>;
    search?: string;
    /** Campi su cui cercare il testo libero. */
    searchFields?: (row: T) => (string | number)[];
    sort?: { key: K; dir: SortDir; value: (row: T, key: K) => string | number };
    page?: { current: number; size: number };
}

export interface ListResult<T> extends PageSlice<T> {
    /** Tutte le righe che soddisfano filtri e ricerca (per export e conteggi). */
    filtered: T[];
}

export function queryRows<T, K extends string>(rows: readonly T[], q: ListQuery<T, K>): ListResult<T> {
    let list = rows as T[];
    for (const f of q.filters ?? []) list = list.filter(f);
    if (q.search && q.searchFields) {
        const fields = q.searchFields;
        list = list.filter((r) => matchesQuery(r, q.search!, fields));
    }
    if (q.sort) list = sortRows(list, q.sort.key, q.sort.dir, q.sort.value);
    const slice = q.page
        ? paginate(list, q.page.current, q.page.size)
        : { page: 1, totalPages: 1, rows: list };
    return { ...slice, filtered: list };
}

/** Accessor di default: legge la proprietà omonima della chiave di ordinamento. */
export function byKey<T, K extends string>(row: T, key: K): string | number {
    return (row as Record<string, unknown>)[key] as string | number;
}
