import { describe, expect, it } from 'vitest';
import { cambiaStatoAcquisto, fetchAcquisti, riceviAcquisto } from './acquisti';
import { fetchMovimenti, fetchProdotti } from './inventario';

// Integrazione mock: il ricevimento deve muovere il magazzino esattamente
// come farà la transazione backend (carico + costo medio + stato ordine).
describe('ricevimento merce', () => {
    it('carica il magazzino, ricalcola il costo medio, aggiorna lo stato', async () => {
        const prima = (await fetchProdotti()).find((p) => p.id === 6)!; // Alimentatore DIN, giacenza 0
        const o = await riceviAcquisto({ id: 1, data: '2026-08-20', quantita: [10, 0] });

        expect(o.stato).toBe('parziale');
        expect(o.righe[0]!.ricevuta).toBe(10);
        const dopo = (await fetchProdotti()).find((p) => p.id === 6)!;
        expect(dopo.giacenza).toBe(prima.giacenza + 10);
        expect(dopo.costo).toBe(44); // giacenza era zero → costo d'acquisto
        const mov = (await fetchMovimenti())[0]!;
        expect(mov).toMatchObject({ prodottoId: 6, tipo: 'carico', quantita: 10, acquistoId: 1 });
    });

    it('rifiuta quantità oltre il residuo', async () => {
        await expect(riceviAcquisto({ id: 1, data: '2026-08-20', quantita: [999, 0] })).rejects.toThrow();
    });

    it('chiude l’ordine quando tutto è ricevuto; poi non si annulla', async () => {
        const o = await riceviAcquisto({ id: 1, data: '2026-08-21', quantita: [20, 40] });
        expect(o.stato).toBe('ricevuto');
        await expect(cambiaStatoAcquisto(1, 'annullato')).rejects.toThrow();
        expect((await fetchAcquisti()).find((x) => x.id === 1)!.stato).toBe('ricevuto');
    });
});
