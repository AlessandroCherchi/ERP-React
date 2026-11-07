import { describe, expect, it } from 'vitest';
import { applicaInMagazzino, differenza, GiacenzaInsufficienteError, riepilogoConta, totaleGiacenze, trasferisci, type RigaConta } from './magazzino';

describe('giacenze per magazzino', () => {
    it('carico/scarico/rettifica sul solo magazzino indicato', () => {
        const g = { '1': 10, '2': 5 };
        expect(applicaInMagazzino(g, 2, 'carico', 3)).toEqual({ '1': 10, '2': 8 });
        expect(applicaInMagazzino(g, 1, 'scarico', 20)).toEqual({ '1': 0, '2': 5 });
        expect(applicaInMagazzino(g, 3, 'rettifica', 7)).toEqual({ '1': 10, '2': 5, '3': 7 });
    });

    it('il trasferimento non cambia il totale', () => {
        const g = trasferisci({ '1': 10 }, 1, 2, 4);
        expect(g).toEqual({ '1': 6, '2': 4 });
        expect(totaleGiacenze(g)).toBe(10);
    });

    it('trasferimento oltre la disponibilità o sullo stesso magazzino rifiutato', () => {
        expect(() => trasferisci({ '1': 2 }, 1, 2, 3)).toThrow(GiacenzaInsufficienteError);
        expect(() => trasferisci({ '1': 2 }, 1, 1, 1)).toThrow();
    });
});

describe('inventario fisico', () => {
    const riga = (attesa: number, contata: number | null, costo = 2): RigaConta =>
        ({ prodottoId: 1, sku: 'S', nome: 'N', unita: 'pz', attesa, contata, costo });

    it('differenze e valorizzazione (righe non contate escluse)', () => {
        expect(differenza(riga(10, 8))).toBe(-2);
        expect(differenza(riga(10, null))).toBe(0);
        expect(riepilogoConta({ righe: [riga(10, 8), riga(5, 6, 10), riga(3, null)] })).toEqual({
            righe: 3, contate: 2, conDifferenza: 2, valoreDifferenze: 6,
        });
    });
});
