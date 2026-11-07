import { describe, expect, it } from 'vitest';
import {
    acquistoMachine, costoMedioPonderato, costoNettoUnitario, proposteRiordino, residuo, statoDaRicevimento,
    type OrdineAcquisto, type RigaAcquisto,
} from './acquisto';
import type { Prodotto } from './prodotto';

const riga = (p: Partial<RigaAcquisto>): RigaAcquisto => ({
    prodottoId: 1, sku: 'S', nome: 'N', unita: 'pz', quantita: 10, prezzo: 5, sconto: 0, iva: 22, ricevuta: 0, ...p,
});

const prodotto = (p: Partial<Prodotto>): Prodotto => ({
    id: 1, sku: 'S', nome: 'N', categoria: 'C', fornitoreId: 1, costo: 10, prezzo: 20,
    giacenza: 0, scorta: 10, unita: 'pz', iva: 22, ubicazione: '', descrizione: '', ...p,
});

describe('ciclo di vita ordine d’acquisto', () => {
    it('parziale e ricevuto si raggiungono solo dopo l’invio', () => {
        expect(acquistoMachine.canTransition('bozza', 'ricevuto')).toBe(false);
        expect(acquistoMachine.canTransition('inviato', 'parziale')).toBe(true);
        expect(acquistoMachine.canTransition('parziale', 'annullato')).toBe(false);
        expect(acquistoMachine.isTerminal('ricevuto')).toBe(true);
    });

    it('stato dalle quantità ricevute', () => {
        expect(statoDaRicevimento([riga({ ricevuta: 0 })])).toBe('inviato');
        expect(statoDaRicevimento([riga({ ricevuta: 4 }), riga({ ricevuta: 10 })])).toBe('parziale');
        expect(statoDaRicevimento([riga({ ricevuta: 10 })])).toBe('ricevuto');
        expect(residuo(riga({ ricevuta: 12 }))).toBe(0);
    });
});

describe('valorizzazione', () => {
    it('costo medio ponderato', () => {
        // 10 pz a 10 € + 10 pz a 13 € → 11,50 €
        expect(costoMedioPonderato(10, 10, 10, 13)).toBe(11.5);
        // giacenza zero: vale il costo d'acquisto
        expect(costoMedioPonderato(0, 10, 5, 12)).toBe(12);
    });

    it('costo netto di riga con sconto', () => {
        expect(costoNettoUnitario({ prezzo: 40, sconto: 15 })).toBe(34);
    });
});

describe('riordino suggerito', () => {
    it('riporta la disponibilità a 2 × scorta, raggruppando per fornitore', () => {
        const p = proposteRiordino([
            prodotto({ id: 1, giacenza: 4, scorta: 10, fornitoreId: 1 }),
            prodotto({ id: 2, giacenza: 0, scorta: 5, fornitoreId: 2 }),
            prodotto({ id: 3, giacenza: 50, scorta: 10, fornitoreId: 1 }), // coperto
            prodotto({ id: 4, giacenza: 0, scorta: 10, fornitoreId: null }), // senza fornitore
        ], []);
        expect(p).toHaveLength(2);
        expect(p.find((x) => x.fornitoreId === 1)!.righe.map((r) => [r.prodotto.id, r.quantita])).toEqual([[1, 16]]);
        expect(p.find((x) => x.fornitoreId === 2)!.righe[0]!.quantita).toBe(10);
    });

    it('conta la merce già in arrivo (residui degli ordini aperti)', () => {
        const ordine = { stato: 'parziale', righe: [riga({ prodottoId: 1, quantita: 20, ricevuta: 8 })] } as OrdineAcquisto;
        const p = proposteRiordino([prodotto({ id: 1, giacenza: 4, scorta: 10 })], [ordine]);
        expect(p[0]!.righe[0]!.quantita).toBe(4); // 20 − 4 − 12 in arrivo
    });

    it('nessuna proposta se la merce in arrivo copre il fabbisogno', () => {
        const ordine = { stato: 'bozza', righe: [riga({ prodottoId: 1, quantita: 30 })] } as OrdineAcquisto;
        expect(proposteRiordino([prodotto({ id: 1, giacenza: 0, scorta: 10 })], [ordine])).toEqual([]);
    });
});
