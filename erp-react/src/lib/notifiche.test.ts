import { describe, expect, it } from 'vitest';
import { calcolaNotifiche } from './notifiche';
import type { Prodotto } from '../types/prodotto';

const p = (giacenza: number, scorta = 10) => ({ giacenza, scorta }) as Prodotto;
const vuoto = { prodotti: [], ordini: [], fatture: [], incassi: [], acquisti: [], oggi: '2026-09-01' };

describe('centro notifiche', () => {
    it('nessun avviso con dati in ordine', () => {
        expect(calcolaNotifiche({ ...vuoto, prodotti: [p(50)] })).toEqual([]);
    });

    it('avvisi derivati, i critici prima', () => {
        const n = calcolaNotifiche({ ...vuoto, prodotti: [p(0), p(5), p(3)] });
        expect(n.map((x) => [x.id, x.testo])).toEqual([
            ['esauriti', '1 articolo esaurito'],
            ['sotto-scorta', '2 articoli sotto scorta'],
        ]);
        expect(n[0]!.link).toBe('/inventario?stato=esaurito');
    });
});
