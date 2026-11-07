// Utilità di ordinamento/paginazione condivise dalle tabelle elenco
// (Clienti, Inventario, Fornitori). Funzioni pure, niente hook: ogni pagina
// mantiene il proprio stato esplicito, qui vivono solo le parti fiddly che
// altrimenti verrebbero riscritte identiche tre volte.

export type SortDir = 'asc' | 'desc';

/**
 * Confronto stabile fra due valori di cella.
 * Le stringhe sono confrontate case-insensitive, così "adriatica" e
 * "Adriatica" non finiscono in due blocchi separati dell'ordinamento.
 */
export function compareValues(a: string | number, b: string | number, dir: SortDir): number {
    const na = typeof a === 'string' ? a.toLowerCase() : a;
    const nb = typeof b === 'string' ? b.toLowerCase() : b;
    if (na < nb) return dir === 'asc' ? -1 : 1;
    if (na > nb) return dir === 'asc' ? 1 : -1;
    return 0;
}

/** Copia ordinata delle righe (non muta l'array in ingresso). */
export function sortRows<T, K extends string>(
    rows: T[],
    key: K,
    dir: SortDir,
    value: (row: T, key: K) => string | number
): T[] {
    return rows.slice().sort((a, b) => compareValues(value(a, key), value(b, key), dir));
}

/**
 * Ricerca testuale su più campi della riga.
 * Query vuota = nessun filtro, così il chiamante non deve gestire il caso.
 */
export function matchesQuery<T>(row: T, query: string, fields: (row: T) => (string | number)[]): boolean {
    if (!query) return true;
    const q = query.toLowerCase();
    return fields(row).some((f) => String(f ?? '').toLowerCase().includes(q));
}

export interface PageSlice<T> {
    /** Pagina effettiva, già limitata all'intervallo valido. */
    page: number;
    totalPages: number;
    rows: T[];
}

/**
 * Estrae la pagina richiesta, clampando l'indice.
 * Il clamp evita la pagina bianca quando un filtro riduce i risultati mentre
 * l'utente è su una pagina alta.
 */
export function paginate<T>(rows: T[], currentPage: number, perPage: number): PageSlice<T> {
    const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
    const page = Math.min(Math.max(1, currentPage), totalPages);
    return { page, totalPages, rows: rows.slice((page - 1) * perPage, page * perPage) };
}
