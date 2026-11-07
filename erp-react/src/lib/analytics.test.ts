import { describe, expect, it } from 'vitest';
import { fatturatoMensile, magazzinoPerCategoria, ordiniPerStato, topProdotti, ultimiMesi } from './analytics';
import type { Fattura } from '../types/fattura';
import type { Ordine } from '../types/ordine';
import type { Prodotto } from '../types/prodotto';

const riga = { prodottoId: 1, sku: 'A', nome: 'Alfa', unita: 'pz', quantita: 2, prezzo: 10, sconto: 0, iva: 22 };

describe('analytics', () => {
    it('ultimi mesi a cavallo d’anno', () => {
        expect(ultimiMesi(3, '2026-01-15')).toEqual(['2025-11', '2025-12', '2026-01']);
    });

    it('fatturato mensile: solo emesse, NC a sottrarre', () => {
        const base = { cliente: { nome: 'C' }, righe: [riga], stato: 'emessa' } as unknown as Fattura;
        const r = fatturatoMensile([
            { ...base, data: '2026-08-10', tipo: 'TD01' },
            { ...base, data: '2026-08-20', tipo: 'TD04', righe: [{ ...riga, quantita: 1 }] },
            { ...base, data: '2026-07-01', tipo: 'TD01', stato: 'bozza' },
        ], 2, '2026-08-31');
        expect(r).toEqual([{ mese: '2026-07', valore: 0 }, { mese: '2026-08', valore: 10 }]);
    });

    it('top prodotti esclude bozze e annullati', () => {
        const o = (stato: Ordine['stato'], quantita: number) => ({ stato, righe: [{ ...riga, quantita }] }) as Ordine;
        expect(topProdotti([o('consegnato', 3), o('bozza', 100), o('annullato', 100), o('spedito', 1)])).toEqual([
            { prodottoId: 1, nome: 'Alfa', sku: 'A', quantita: 4, ricavo: 40 },
        ]);
        expect(ordiniPerStato([o('bozza', 1), o('bozza', 1)]).bozza).toBe(2);
    });

    it('magazzino per categoria', () => {
        const p = (categoria: string, giacenza: number, costo: number) => ({ categoria, giacenza, costo, scorta: 5 }) as Prodotto;
        expect(magazzinoPerCategoria([p('X', 10, 2), p('X', 1, 1), p('Y', 100, 1)])).toEqual([
            { categoria: 'Y', articoli: 1, valore: 100, sottoScorta: 0 },
            { categoria: 'X', articoli: 2, valore: 21, sottoScorta: 1 },
        ]);
    });
});
