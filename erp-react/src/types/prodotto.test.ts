import { describe, expect, it } from 'vitest';
import { applicaMovimento, margineUnitario, statoProdotto, valoreGiacenza } from './prodotto';

describe('stato di magazzino (derivato)', () => {
    it.each([
        [0, 10, 'esaurito'],
        [-1, 10, 'esaurito'],
        [10, 10, 'sotto-scorta'],
        [5, 10, 'sotto-scorta'],
        [11, 10, 'disponibile'],
    ] as const)('giacenza %d, scorta %d → %s', (giacenza, scorta, atteso) => {
        expect(statoProdotto({ giacenza, scorta })).toBe(atteso);
    });
});

describe('applicaMovimento', () => {
    it('carico somma, scarico sottrae', () => {
        expect(applicaMovimento(10, 'carico', 5)).toBe(15);
        expect(applicaMovimento(10, 'scarico', 4)).toBe(6);
    });

    it('rettifica imposta il valore assoluto', () => {
        expect(applicaMovimento(10, 'rettifica', 3)).toBe(3);
    });

    it('la giacenza non scende mai sotto zero', () => {
        expect(applicaMovimento(2, 'scarico', 5)).toBe(0);
        expect(applicaMovimento(2, 'rettifica', -4)).toBe(0);
    });
});

describe('valori', () => {
    it('valore giacenza e margine', () => {
        expect(valoreGiacenza({ giacenza: 4, costo: 2.5 })).toBe(10);
        expect(margineUnitario({ prezzo: 10, costo: 6 })).toBe(4);
    });
});
