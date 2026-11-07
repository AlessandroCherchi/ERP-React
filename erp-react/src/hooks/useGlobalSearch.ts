import { useMemo } from 'react';
import { useAcquisti, useClienti, useFatture, useFornitori, useOrdini, useProdotti } from '../data';
import { useVisibleModules } from '../app/useModules';
import type { ModuleId } from '../app/moduleIds';

export interface SearchHit {
    id: string;
    modulo: ModuleId;
    icon: string;
    titolo: string;
    sottotitolo: string;
    link: string;
}

const MAX_PER_GRUPPO = 4;

/**
 * Ricerca trasversale ai moduli visibili. Ogni risultato porta all'elenco
 * del modulo già filtrato (`?q=`), dove il dettaglio è a un clic: niente
 * route di dettaglio duplicate.
 */
export function useGlobalSearch(query: string): SearchHit[] {
    const visibili = useVisibleModules();
    const { data: clienti = [] } = useClienti();
    const { data: fornitori = [] } = useFornitori();
    const { data: prodotti = [] } = useProdotti();
    const { data: ordini = [] } = useOrdini();
    const { data: fatture = [] } = useFatture();
    const { data: acquisti = [] } = useAcquisti();

    return useMemo(() => {
        const q = query.trim().toLowerCase();
        if (q.length < 2) return [];
        const ammessi = new Set(visibili.map((m) => m.id));
        const has = (...fields: (string | null | undefined)[]) => fields.some((f) => f?.toLowerCase().includes(q));
        const link = (path: string, term: string) => `${path}?q=${encodeURIComponent(term)}`;
        const gruppi: Array<[ModuleId, SearchHit[]]> = [
            ['clienti', clienti.filter((c) => has(c.nome, c.piva, c.email, c.citta)).map((c) => ({ id: `c${c.id}`, modulo: 'clienti', icon: 'fa-user', titolo: c.nome, sottotitolo: [c.citta, c.piva].filter(Boolean).join(' · '), link: link('/clienti', c.nome) }))],
            ['fornitori', fornitori.filter((f) => has(f.nome, f.piva, f.citta)).map((f) => ({ id: `f${f.id}`, modulo: 'fornitori', icon: 'fa-truck-field', titolo: f.nome, sottotitolo: f.categoria, link: link('/fornitori', f.nome) }))],
            ['inventario', prodotti.filter((p) => has(p.nome, p.sku, p.ubicazione)).map((p) => ({ id: `p${p.id}`, modulo: 'inventario', icon: 'fa-box', titolo: p.nome, sottotitolo: `${p.sku} · giacenza ${p.giacenza} ${p.unita}`, link: link('/inventario', p.sku) }))],
            ['vendite', ordini.filter((o) => has(o.numero, o.cliente)).map((o) => ({ id: `o${o.id}`, modulo: 'vendite', icon: 'fa-receipt', titolo: o.numero, sottotitolo: o.cliente, link: link('/vendite', o.numero) }))],
            ['acquisti', acquisti.filter((o) => has(o.numero, o.fornitore)).map((o) => ({ id: `a${o.id}`, modulo: 'acquisti', icon: 'fa-cart-flatbed', titolo: o.numero, sottotitolo: o.fornitore, link: `/acquisti?stato=all&q=${encodeURIComponent(o.numero)}` }))],
            ['fatture', fatture.filter((f) => has(f.numero, f.cliente.nome)).map((f) => ({ id: `i${f.id}`, modulo: 'fatture', icon: 'fa-file-invoice-dollar', titolo: f.numero ?? 'Bozza', sottotitolo: f.cliente.nome, link: link('/fatture', f.numero ?? f.cliente.nome) }))],
        ];
        return gruppi.filter(([m]) => ammessi.has(m)).flatMap(([, hits]) => hits.slice(0, MAX_PER_GRUPPO));
    }, [query, visibili, clienti, fornitori, prodotti, ordini, fatture, acquisti]);
}
