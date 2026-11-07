import { describe, expect, it } from 'vitest';
import {
    imponibileRiga, impegnaMagazzino, inRitardo, ivaRiga, prossimiStati, totaliOrdine,
    transizioneValida, type RigaOrdine,
} from './ordine';

const riga = (p: Partial<RigaOrdine>): RigaOrdine => ({
    prodottoId: 1, sku: 'SKU-1', nome: 'X', unita: 'pz', quantita: 1, prezzo: 10, sconto: 0, iva: 22, ...p,
});

describe('totali ordine', () => {
    it('imponibile di riga con sconto, arrotondato al centesimo', () => {
        expect(imponibileRiga({ quantita: 3, prezzo: 19.99, sconto: 10 })).toBe(53.97);
    });

    it('IVA calcolata sull’imponibile già arrotondato', () => {
        expect(ivaRiga({ quantita: 1, prezzo: 0.05, sconto: 0, iva: 22 })).toBe(0.01);
    });

    it('arrotonda per riga e poi somma (prassi fiscale), non il contrario', () => {
        // 3 righe da 0,333…: per riga 0,33 × 3 = 0,99; sul totale grezzo sarebbe 1,00
        const righe = [1, 2, 3].map((id) => riga({ prodottoId: id, prezzo: 1 / 3, iva: 0 }));
        expect(totaliOrdine(righe).imponibile).toBe(0.99);
    });

    it('totale = imponibile + iva, pezzi sommati', () => {
        const t = totaliOrdine([riga({ quantita: 2, prezzo: 100 }), riga({ quantita: 1, prezzo: 50, iva: 10 })]);
        expect(t).toEqual({ imponibile: 250, iva: 49, totale: 299, pezzi: 3 });
    });

    it('ordine vuoto = tutto zero', () => {
        expect(totaliOrdine([])).toEqual({ imponibile: 0, iva: 0, totale: 0, pezzi: 0 });
    });
});

describe('macchina degli stati', () => {
    it('un ordine consegnato non può tornare indietro (niente doppio scarico)', () => {
        expect(prossimiStati('consegnato')).toEqual([]);
        expect(transizioneValida('consegnato', 'bozza')).toBe(false);
    });

    it('uno spedito non si annulla: la merce è già partita', () => {
        expect(transizioneValida('spedito', 'annullato')).toBe(false);
    });

    it('percorso nominale bozza → consegnato', () => {
        const percorso = ['bozza', 'confermato', 'in-preparazione', 'spedito', 'consegnato'] as const;
        for (let i = 0; i < percorso.length - 1; i++) {
            expect(transizioneValida(percorso[i]!, percorso[i + 1]!)).toBe(true);
        }
    });

    it('impegna il magazzino da confermato in poi, mai in bozza o annullato', () => {
        expect(impegnaMagazzino('bozza')).toBe(false);
        expect(impegnaMagazzino('confermato')).toBe(true);
        expect(impegnaMagazzino('consegnato')).toBe(true);
        expect(impegnaMagazzino('annullato')).toBe(false);
    });
});

describe('ritardo', () => {
    it('in ritardo solo se aperto e con consegna scaduta', () => {
        expect(inRitardo({ consegna: '2026-01-01', stato: 'confermato' }, '2026-01-02')).toBe(true);
        expect(inRitardo({ consegna: '2026-01-01', stato: 'consegnato' }, '2026-01-02')).toBe(false);
        expect(inRitardo({ consegna: '', stato: 'confermato' }, '2026-01-02')).toBe(false);
        expect(inRitardo({ consegna: '2026-01-02', stato: 'confermato' }, '2026-01-02')).toBe(false);
    });
});
