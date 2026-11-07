// Mock "server state" degli ordini d'acquisto.
// Come per le vendite, il ciclo di vita e gli effetti sul magazzino stanno
// qui e non nella pagina: nel backend saranno transazioni server-side.

import { caricaDaAcquisto } from './inventario';
import { nomeFornitore } from './fornitori';
import { collection, delay, nextIdOf } from './db';
import {
    acquistoEliminabile, acquistoMachine, acquistoModificabile, acquistoRicevibile, costoNettoUnitario,
    residuo, statoDaRicevimento,
    type AcquistoFormValues, type AcquistoStato, type OrdineAcquisto, type RigaAcquisto,
} from '../../types/acquisto';
import type { RigaDocumento } from '../../types/documento';

const riga = (prodottoId: number, sku: string, nome: string, quantita: number, prezzo: number, ricevuta = 0, unita = 'pz'): RigaAcquisto =>
    ({ prodottoId, sku, nome, unita, quantita, prezzo, sconto: 0, iva: 22, ricevuta });

// Dataset demo coerente con il magazzino: riordini sui prodotti esauriti o
// sotto scorta, fornitori abituali corrispondenti.
const SEED: OrdineAcquisto[] = [
    {
        id: 1, numero: 'OA-2301', fornitoreId: 2, fornitore: 'Elettromeccanica Nord',
        data: '2026-08-12', consegna: '2026-08-22', stato: 'inviato',
        righe: [riga(6, 'SKU-4506', 'Alimentatore DIN 24V', 30, 44), riga(25, 'SKU-4525', 'Contattore Tripolare 25A', 40, 16.4)],
        note: 'Urgente: entrambi gli articoli sono esauriti.',
    },
    {
        id: 2, numero: 'OA-2302', fornitoreId: 3, fornitore: 'LuceItalia S.r.l.',
        data: '2026-08-14', consegna: '2026-08-21', stato: 'parziale',
        righe: [riga(3, 'SKU-4503', 'Pannello LED Ultra', 60, 26, 20), riga(11, 'SKU-4511', 'Striscia LED 5m IP65', 30, 14, 30, 'cf')],
        note: 'Pannelli in consegna in due tranche.',
    },
    {
        id: 3, numero: 'OA-2303', fornitoreId: 4, fornitore: 'CableTech Italia',
        data: '2026-08-05', consegna: '2026-08-10', stato: 'ricevuto',
        righe: [riga(4, 'SKU-4504', 'Cavo Cat.7 Premium', 400, 11, 400, 'm')],
        note: '',
    },
    {
        id: 4, numero: 'OA-2304', fornitoreId: 6, fornitore: 'Strumentazione Sud',
        data: '2026-08-18', consegna: '', stato: 'bozza',
        righe: [riga(24, 'SKU-4524', 'Oscilloscopio 100MHz', 3, 540)],
        note: 'Da confermare il prezzo con il fornitore.',
    },
];

const store = collection('acquisti', SEED);
let nextId = nextIdOf(store);

const conRicevuta = (righe: RigaDocumento[]): RigaAcquisto[] => righe.map((r) => ({ ...r, ricevuta: 0 }));

export async function fetchAcquisti(): Promise<OrdineAcquisto[]> {
    await delay();
    return structuredClone(store);
}

/** Nasce sempre in bozza: l'invio al fornitore è un'azione esplicita. */
export async function createAcquisto(data: AcquistoFormValues): Promise<OrdineAcquisto> {
    await delay();
    const ordine: OrdineAcquisto = {
        ...data,
        id: nextId++,
        fornitore: nomeFornitore(data.fornitoreId),
        stato: 'bozza',
        righe: conRicevuta(data.righe),
    };
    store.push(ordine);
    return structuredClone(ordine);
}

export async function updateAcquisto(id: number, data: AcquistoFormValues): Promise<OrdineAcquisto> {
    await delay();
    const idx = store.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Ordine d’acquisto non trovato');
    if (!acquistoModificabile(store[idx]!.stato)) throw new Error('Solo le bozze sono modificabili');
    store[idx] = { ...store[idx]!, ...data, fornitore: nomeFornitore(data.fornitoreId), righe: conRicevuta(data.righe) };
    return structuredClone(store[idx]!);
}

export async function deleteAcquisto(id: number): Promise<void> {
    await delay();
    const idx = store.findIndex((o) => o.id === id);
    if (idx === -1) return;
    if (!acquistoEliminabile(store[idx]!.stato)) throw new Error('Un ordine con merce ricevuta resta agli atti');
    store.splice(idx, 1);
}

/** Transizioni manuali: invio e annullamento. Parziale/ricevuto solo via ricevimento. */
export async function cambiaStatoAcquisto(id: number, nuovo: Extract<AcquistoStato, 'inviato' | 'annullato'>): Promise<OrdineAcquisto> {
    await delay();
    const idx = store.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Ordine d’acquisto non trovato');
    const ordine = store[idx]!;
    acquistoMachine.assert(ordine.stato, nuovo);
    if (nuovo === 'annullato' && ordine.righe.some((r) => r.ricevuta > 0)) {
        throw new Error('Merce già ricevuta: l’ordine non si può annullare');
    }
    store[idx] = { ...ordine, stato: nuovo };
    return structuredClone(store[idx]!);
}

export interface RicevimentoInput {
    id: number;
    data: string;
    /** Quantità ricevute ora, per indice di riga. */
    quantita: number[];
}

/**
 * Registra un ricevimento (anche parziale): carica il magazzino al costo
 * netto di riga e aggiorna lo stato dell'ordine. Le quantità oltre il
 * residuo sono rifiutate: un eccesso di consegna va gestito con una nuova
 * riga o un nuovo ordine, non nascosto nel ricevimento.
 */
export async function riceviAcquisto(input: RicevimentoInput): Promise<OrdineAcquisto> {
    await delay();
    const idx = store.findIndex((o) => o.id === input.id);
    if (idx === -1) throw new Error('Ordine d’acquisto non trovato');
    const ordine = store[idx]!;
    if (!acquistoRicevibile(ordine.stato)) throw new Error('L’ordine non è in attesa di merce');

    const q = ordine.righe.map((_r, i) => input.quantita[i] ?? 0);
    q.forEach((n, i) => {
        if (n < 0 || n > residuo(ordine.righe[i]!)) throw new Error(`Quantità non valida per ${ordine.righe[i]!.nome}`);
    });
    if (q.every((n) => n === 0)) throw new Error('Indica almeno una quantità ricevuta');

    caricaDaAcquisto({
        acquistoId: ordine.id,
        numero: ordine.numero,
        data: input.data,
        righe: ordine.righe.map((r, i) => ({ prodottoId: r.prodottoId, quantita: q[i]!, costoUnitario: costoNettoUnitario(r) })),
    });

    const righe = ordine.righe.map((r, i) => ({ ...r, ricevuta: r.ricevuta + q[i]! }));
    store[idx] = { ...ordine, righe, stato: statoDaRicevimento(righe) };
    return structuredClone(store[idx]!);
}

/** Crea più bozze in un colpo (riordino suggerito): tutto o niente. */
export async function createAcquistiBatch(list: AcquistoFormValues[]): Promise<OrdineAcquisto[]> {
    await delay();
    const creati = list.map((data) => ({
        ...data,
        id: nextId++,
        fornitore: nomeFornitore(data.fornitoreId),
        stato: 'bozza' as const,
        righe: conRicevuta(data.righe),
    }));
    store.push(...creati);
    return structuredClone(creati);
}
