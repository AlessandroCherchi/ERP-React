import { describe, expect, it } from 'vitest';
import { fromCents, percentOf, roundHalfUp, toCents } from './money';
import { riepilogoIva, totaliDocumento, type RigaDocumento } from '../types/documento';

// Golden test (spec AC-MONEY-01): stessi input e stessi risultati attesi
// vanno replicati nei test del backend.

describe('money', () => {
    it('half-up anche sui casi di rappresentazione binaria', () => {
        expect(toCents(1.005)).toBe(101);
        expect(toCents(2.675)).toBe(268);
        expect(toCents(0.1 + 0.2)).toBe(30);
        expect(roundHalfUp(-2.5)).toBe(-3);
    });

    it('percentuali arrotondate al centesimo', () => {
        expect(percentOf(toCents(0.05), 22)).toBe(1); // 1,1 cent → 1
        expect(percentOf(toCents(0.25), 22)).toBe(6); // 5,5 cent → 6
        expect(fromCents(percentOf(toCents(100), 22))).toBe(22);
    });
});

const riga = (p: Partial<RigaDocumento>): RigaDocumento => ({
    prodottoId: 1, sku: 'S', nome: 'N', unita: 'pz', quantita: 1, prezzo: 0, sconto: 0, iva: 22, ...p,
});

describe('riepilogo IVA per aliquota (FatturaPA DatiRiepilogo)', () => {
    it('l’imposta si calcola sul totale per aliquota, non riga per riga', () => {
        // 3 righe da 0,25 € al 22%: per riga 0,06 × 3 = 0,18; per aliquota 0,75 × 22% = 0,165 → 0,17
        const righe = [1, 2, 3].map((id) => riga({ prodottoId: id, prezzo: 0.25 }));
        expect(riepilogoIva(righe)).toEqual([{ aliquota: 22, imponibile: 0.75, imposta: 0.17 }]);
        expect(totaliDocumento(righe)).toEqual({ imponibile: 0.75, iva: 0.17, totale: 0.92, pezzi: 3 });
    });

    it('raggruppa per aliquota, ordinato decrescente', () => {
        const r = riepilogoIva([riga({ prezzo: 10, iva: 4 }), riga({ prezzo: 100 }), riga({ prezzo: 20, iva: 4 })]);
        expect(r.map((x) => x.aliquota)).toEqual([22, 4]);
        expect(r[1]).toEqual({ aliquota: 4, imponibile: 30, imposta: 1.2 });
    });

    it('quantità frazionarie e sconti', () => {
        const t = totaliDocumento([riga({ quantita: 2.5, prezzo: 3.99, sconto: 12.5, iva: 10 })]);
        // 2,5 × 3,99 = 9,975 × 0,875 = 8,728125 → 8,73; IVA 10% = 0,873 → 0,87
        expect(t).toEqual({ imponibile: 8.73, iva: 0.87, totale: 9.6, pezzi: 2.5 });
    });
});
