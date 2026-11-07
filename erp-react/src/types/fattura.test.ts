import { describe, expect, it } from 'vitest';
import {
    fasciaAging, notaCreditoDa, ordiniGiaFatturati, registroIvaVendite, scadenza, situazione,
    type Fattura, type Incasso,
} from './fattura';

const fattura = (p: Partial<Fattura>): Fattura => ({
    id: 1, numero: '2026/0001', tipo: 'TD01', clienteId: 1,
    cliente: { nome: 'C', piva: 'IT01234567890', cf: '', indirizzo: '', citta: '', provincia: '', sdi: 'ABC1234', pec: '' },
    data: '2026-08-01', terminiPagamento: '30', metodoPagamento: 'bonifico',
    righe: [{ prodottoId: 1, sku: 'S', nome: 'N', unita: 'pz', quantita: 1, prezzo: 100, sconto: 0, iva: 22 }],
    ordineIds: [], stato: 'emessa', sdi: 'consegnata', note: '', ...p,
});

describe('scadenze e situazione pagamenti', () => {
    it('scadenza = data + giorni, anche a cavallo di mese', () => {
        expect(scadenza({ data: '2026-08-15', terminiPagamento: '30' })).toBe('2026-09-14');
        expect(scadenza({ data: '2026-01-31', terminiPagamento: '0' })).toBe('2026-01-31');
    });

    it('residuo = totale − incassi − note di credito collegate', () => {
        const f = fattura({});
        const nc = fattura({ id: 2, tipo: 'TD04', fatturaOrigineId: 1, righe: [{ ...f.righe[0]!, prezzo: 20 }] });
        const inc: Incasso[] = [{ id: 1, fatturaId: 1, data: '2026-08-10', importo: 50, metodo: 'bonifico', note: '' }];
        const s = situazione(f, inc, [f, nc], '2026-08-20');
        expect(s).toMatchObject({ totale: 122, incassato: 50, stornato: 24.4, residuo: 47.6, stato: 'parziale' });
    });

    it('scaduta se residuo > 0 oltre la scadenza; pagata a residuo zero', () => {
        const f = fattura({});
        expect(situazione(f, [], [f], '2026-09-15').stato).toBe('scaduta');
        const tutto: Incasso[] = [{ id: 1, fatturaId: 1, data: '2026-08-02', importo: 122, metodo: 'bonifico', note: '' }];
        expect(situazione(f, tutto, [f], '2026-12-31').stato).toBe('pagata');
    });

    it('fasce di anzianità', () => {
        expect(fasciaAging('2026-09-10', '2026-09-01')).toBe('a-scadere');
        expect(fasciaAging('2026-09-01', '2026-09-20')).toBe('0-30');
        expect(fasciaAging('2026-06-01', '2026-09-20')).toBe('oltre-90');
    });
});

describe('documenti', () => {
    it('nota di credito: storno completo, cliente e righe dall’origine', () => {
        const nc = notaCreditoDa(fattura({ numero: '2026/0007' }), '2026-09-01');
        expect(nc).toMatchObject({ tipo: 'TD04', clienteId: 1, fatturaOrigineId: 1, note: 'Storno 2026/0007' });
        expect(nc.righe).toHaveLength(1);
    });

    it('le note di credito non liberano gli ordini fatturati', () => {
        const s = ordiniGiaFatturati([{ tipo: 'TD01', ordineIds: [1, 2] }, { tipo: 'TD04', ordineIds: [3] }]);
        expect([...s]).toEqual([1, 2]);
    });

    it('registro IVA: per mese e aliquota, NC a sottrarre, bozze escluse', () => {
        const r = registroIvaVendite([
            fattura({}),
            fattura({ id: 2, tipo: 'TD04', data: '2026-08-20', righe: [{ prodottoId: 1, sku: 'S', nome: 'N', unita: 'pz', quantita: 1, prezzo: 10, sconto: 0, iva: 22 }] }),
            fattura({ id: 3, stato: 'bozza' }),
        ]);
        expect(r).toEqual([{ periodo: '2026-08', aliquota: 22, imponibile: 90, imposta: 19.8 }]);
    });
});
