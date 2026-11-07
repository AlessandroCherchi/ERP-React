import { describe, expect, it } from 'vitest';
import { byKey, queryRows } from './listQuery';

interface Row { id: number; nome: string; stato: 'a' | 'b'; valore: number }
const rows: Row[] = [
    { id: 1, nome: 'Beta', stato: 'a', valore: 30 },
    { id: 2, nome: 'alfa', stato: 'b', valore: 10 },
    { id: 3, nome: 'Gamma', stato: 'a', valore: 20 },
];

describe('queryRows', () => {
    it('applica filtri, ricerca, ordinamento e pagina in sequenza', () => {
        const r = queryRows(rows, {
            filters: [(x) => x.stato === 'a'],
            search: 'a',
            searchFields: (x) => [x.nome],
            sort: { key: 'valore', dir: 'asc', value: byKey },
            page: { current: 1, size: 1 },
        });
        expect(r.filtered.map((x) => x.id)).toEqual([3, 1]);
        expect(r.rows.map((x) => x.id)).toEqual([3]);
        expect(r.totalPages).toBe(2);
    });

    it('ordinamento testuale case-insensitive', () => {
        const r = queryRows(rows, { sort: { key: 'nome', dir: 'asc', value: byKey } });
        expect(r.rows.map((x) => x.nome)).toEqual(['alfa', 'Beta', 'Gamma']);
    });

    it('pagina fuori intervallo → ultima pagina valida (niente pagina bianca)', () => {
        const r = queryRows(rows, { page: { current: 9, size: 2 } });
        expect(r.page).toBe(2);
        expect(r.rows).toHaveLength(1);
    });

    it('senza opzioni restituisce tutto, senza mutare l’input', () => {
        const copy = [...rows];
        const r = queryRows(rows, { sort: { key: 'valore', dir: 'desc', value: byKey } });
        expect(r.filtered).toHaveLength(3);
        expect(rows).toEqual(copy);
    });
});
