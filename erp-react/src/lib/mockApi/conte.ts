// Mock inventario fisico (conte). Apertura = snapshot delle giacenze a
// sistema; chiusura = rettifiche per le sole righe contate con differenza.

import { collection, delay, nextIdOf } from './db';
import { prodottiSnapshot, rettificheDaConta } from './inventario';
import { contaMachine, giacenzaIn, type ContaInventario } from '../../types/magazzino';

const store = collection<ContaInventario>('conte', []);
let nextId = nextIdOf(store);

const trova = (id: number) => {
    const c = store.find((x) => x.id === id);
    if (!c) throw new Error('Conta non trovata');
    return c;
};

export async function fetchConte(): Promise<ContaInventario[]> {
    await delay();
    return structuredClone(store);
}

export interface AperturaContaInput {
    magazzinoId: number;
    categoria: string;
    data: string;
    note: string;
}

export async function apriConta(input: AperturaContaInput): Promise<ContaInventario> {
    await delay();
    if (store.some((c) => c.stato === 'aperta' && c.magazzinoId === input.magazzinoId)) {
        throw new Error('C’è già una conta in corso su questo magazzino');
    }
    const righe = prodottiSnapshot()
        .filter((p) => !input.categoria || p.categoria === input.categoria)
        .map((p) => ({ prodottoId: p.id, sku: p.sku, nome: p.nome, unita: p.unita, attesa: giacenzaIn(p.giacenze, input.magazzinoId), contata: null, costo: p.costo }));
    if (righe.length === 0) throw new Error('Nessun articolo da contare con questi filtri');
    const id = nextId++;
    const conta: ContaInventario = { ...input, id, numero: `INV-${String(id).padStart(4, '0')}`, stato: 'aperta', righe };
    store.push(conta);
    return structuredClone(conta);
}

/** Salva i conteggi parziali (per indice di riga). */
export async function salvaConteggi(id: number, contate: Array<number | null>): Promise<ContaInventario> {
    await delay();
    const c = trova(id);
    if (c.stato !== 'aperta') throw new Error('La conta non è più modificabile');
    c.righe = c.righe.map((r, i) => ({ ...r, contata: contate[i] === undefined ? r.contata : contate[i]! }));
    return structuredClone(c);
}

/** Chiusura: applica le rettifiche. Le righe non contate restano invariate. */
export async function chiudiConta(id: number): Promise<{ conta: ContaInventario; rettifiche: number }> {
    await delay();
    const c = trova(id);
    contaMachine.assert(c.stato, 'chiusa');
    const rettifiche = rettificheDaConta({
        magazzinoId: c.magazzinoId,
        numero: c.numero,
        data: c.data,
        righe: c.righe.filter((r) => r.contata != null).map((r) => ({ prodottoId: r.prodottoId, contata: r.contata! })),
    });
    c.stato = 'chiusa';
    return { conta: structuredClone(c), rettifiche };
}

export async function annullaConta(id: number): Promise<ContaInventario> {
    await delay();
    const c = trova(id);
    contaMachine.assert(c.stato, 'annullata');
    c.stato = 'annullata';
    return structuredClone(c);
}
