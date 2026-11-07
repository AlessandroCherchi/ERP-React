import { describe, expect, it } from 'vitest';
import { createFattura, emettiFattura, fetchFatture, inviaSdi, registraIncasso, updateFattura } from './fatture';
import { createCliente, updateCliente } from './clienti';
import { EMPTY_CLIENTE_FORM } from '../../types/cliente';

const riga = { prodottoId: 1, sku: 'SKU-4501', nome: 'Widget', unita: 'pz', quantita: 2, prezzo: 54, sconto: 0, iva: 22 };

describe('fatture (comportamento backend simulato)', () => {
    it('la bozza non ha numero; l’emissione assegna il progressivo dell’anno', async () => {
        const b = await createFattura({ tipo: 'TD01', clienteId: 2, data: '2026-09-01', terminiPagamento: '30', metodoPagamento: 'bonifico', righe: [riga], note: '' });
        expect(b.numero).toBeNull();
        const e = await emettiFattura(b.id);
        expect(e.numero).toBe('2026/0143'); // dopo 2026/0142 del dataset demo
        await expect(updateFattura(b.id, { ...b, righe: [riga] })).rejects.toThrow(/nota di credito/);
    });

    it('SDI: consegnata con recapito valido', async () => {
        const f = (await fetchFatture()).find((x) => x.numero === '2026/0143')!;
        expect((await inviaSdi(f.id)).sdi).toBe('consegnata');
    });

    it('SDI: scarto 00305 con P.IVA non valida, poi reinvio dopo la correzione', async () => {
        const cliente = await createCliente({ ...EMPTY_CLIENTE_FORM, nome: 'Test Srl', email: 't@t.it', piva: 'IT123', sdi: 'XYZ9999' });
        const b = await createFattura({ tipo: 'TD01', clienteId: cliente.id, data: '2026-09-02', terminiPagamento: '30', metodoPagamento: 'bonifico', righe: [riga], note: '' });
        const e = await emettiFattura(b.id);
        const scartata = await inviaSdi(e.id);
        expect(scartata.sdi).toBe('scartata');
        expect(scartata.esitoSdi?.codice).toBe('00305');

        await updateCliente(cliente.id, { ...EMPTY_CLIENTE_FORM, nome: 'Test Srl', email: 't@t.it', piva: 'IT01234567890', sdi: 'XYZ9999' });
        expect((await inviaSdi(e.id)).sdi).toBe('consegnata');
    });

    it('incasso oltre il residuo rifiutato', async () => {
        const f = (await fetchFatture()).find((x) => x.numero === '2026/0143')!;
        await expect(registraIncasso({ fatturaId: f.id, data: '2026-09-10', importo: 1_000_000, metodo: 'bonifico', note: '' })).rejects.toThrow(/residuo/);
        const ok = await registraIncasso({ fatturaId: f.id, data: '2026-09-10', importo: 10, metodo: 'bonifico', note: '' });
        expect(ok.importo).toBe(10);
    });

    it('un ordine già fatturato non si rifattura', async () => {
        await expect(createFattura({ tipo: 'TD01', clienteId: 1, data: '2026-09-01', terminiPagamento: '30', metodoPagamento: 'bonifico', righe: [riga], note: '', ordineIds: [1] })).rejects.toThrow(/già fatturati/);
    });
});
