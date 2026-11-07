import { describe, expect, it } from 'vitest';
import { fetchMovimenti, fetchProdotti, trasferisci } from './inventario';
import { apriConta, chiudiConta, salvaConteggi } from './conte';

describe('multi-magazzino e conte (adapter)', () => {
    it('trasferimento: giacenze per magazzino aggiornate, movimento registrato', async () => {
        await trasferisci({ prodottoId: 4, da: 1, a: 2, quantita: 40, data: '2026-09-01', note: '' });
        const p = (await fetchProdotti()).find((x) => x.id === 4)!;
        expect(p.giacenze).toEqual({ '1': 400, '2': 240 });
        expect(p.giacenza).toBe(640);
        expect((await fetchMovimenti())[0]).toMatchObject({ tipo: 'trasferimento', magazzinoId: 1, magazzinoDestId: 2, quantita: 40 });
    });

    it('conta: snapshot all’apertura, rettifiche solo sulle righe contate con differenza', async () => {
        const c = await apriConta({ magazzinoId: 2, categoria: '', data: '2026-09-02', note: '' });
        const i = c.righe.findIndex((r) => r.prodottoId === 4);
        expect(c.righe[i]!.attesa).toBe(240);
        await expect(apriConta({ magazzinoId: 2, categoria: '', data: '2026-09-02', note: '' })).rejects.toThrow(/in corso/);

        const contate = c.righe.map((_r, j) => (j === i ? 230 : null));
        await salvaConteggi(c.id, contate);
        const { rettifiche } = await chiudiConta(c.id);
        expect(rettifiche).toBe(1);
        const p = (await fetchProdotti()).find((x) => x.id === 4)!;
        expect(p.giacenze['2']).toBe(230);
        expect(p.giacenza).toBe(630);
    });
});
