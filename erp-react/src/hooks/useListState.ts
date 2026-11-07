// Stato di una pagina elenco (ricerca, filtri, ordinamento, pagina)
// sincronizzato con la query string: un elenco filtrato è un link
// condivisibile e sopravvive a refresh e "indietro" del browser.
//
// Tipizzato sui filtri della pagina: `filters.stato` è del tipo dichiarato
// nei default, non una stringa qualunque.

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { SortDir } from '../lib/tableUtils';

export interface ListStateOptions<K extends string, F extends Record<string, string>> {
    sort: { key: K; dir: SortDir };
    /** Valori di default dei filtri; un filtro al default non compare nell'URL. */
    filters: F;
}

export interface ListState<K extends string, F extends Record<string, string>> {
    search: string;
    setSearch: (v: string) => void;
    filters: F;
    setFilter: <N extends keyof F>(name: N, value: F[N]) => void;
    sortKey: K;
    sortDir: SortDir;
    toggleSort: (key: K) => void;
    page: number;
    setPage: (p: number) => void;
}

const RESERVED = { search: 'q', sort: 'sort', dir: 'dir', page: 'page' } as const;

export function useListState<K extends string, F extends Record<string, string>>(
    opts: ListStateOptions<K, F>
): ListState<K, F> {
    const [params, setParams] = useSearchParams();

    /** Aggiorna più parametri in un colpo, rimuovendo quelli al default. */
    const patch = useCallback((changes: Record<string, string | null>, resetPage = true) => {
        setParams((prev) => {
            const next = new URLSearchParams(prev);
            for (const [k, v] of Object.entries(changes)) {
                if (v === null || v === '') next.delete(k);
                else next.set(k, v);
            }
            if (resetPage) next.delete(RESERVED.page);
            return next;
        }, { replace: true });
    }, [setParams]);

    const filters = useMemo(() => {
        const out = { ...opts.filters };
        for (const name of Object.keys(opts.filters) as (keyof F)[]) {
            const v = params.get(String(name));
            if (v !== null) out[name] = v as F[keyof F];
        }
        return out;
        // opts.filters è un letterale stabile per pagina: dipendere dai params basta
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params]);

    const sortKey = (params.get(RESERVED.sort) as K | null) ?? opts.sort.key;
    const sortDir = (params.get(RESERVED.dir) as SortDir | null) ?? opts.sort.dir;
    const page = Math.max(1, Number(params.get(RESERVED.page)) || 1);

    return {
        search: params.get(RESERVED.search) ?? '',
        setSearch: (v) => patch({ [RESERVED.search]: v }),
        filters,
        setFilter: (name, value) =>
            patch({ [String(name)]: value === opts.filters[name] ? null : value }),
        sortKey,
        sortDir,
        toggleSort: (key) => {
            const dir: SortDir = key === sortKey ? (sortDir === 'asc' ? 'desc' : 'asc') : 'asc';
            const isDefault = key === opts.sort.key && dir === opts.sort.dir;
            patch({ [RESERVED.sort]: isDefault ? null : key, [RESERVED.dir]: isDefault ? null : dir }, false);
        },
        page,
        setPage: (p) => patch({ [RESERVED.page]: p > 1 ? String(p) : null }, false),
    };
}
