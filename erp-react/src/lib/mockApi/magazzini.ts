// Mock anagrafica magazzini. Esiste sempre esattamente un magazzino principale.

import { collection, delay, nextIdOf } from './db';
import type { Magazzino, MagazzinoFormValues } from '../../types/magazzino';

const SEED: Magazzino[] = [
    { id: 1, codice: 'SEDE', nome: 'Magazzino Sede', indirizzo: 'Via Roma 1, Roma', principale: true, attivo: true },
    { id: 2, codice: 'NORD', nome: 'Deposito Nord', indirizzo: 'Via dell’Industria 22, Milano', principale: false, attivo: true },
];

const store = collection('magazzini', SEED);
let nextId = nextIdOf(store);

/** Id del magazzino principale (default di vendite, acquisti, movimenti). */
export function magazzinoPrincipaleId(): number {
    return (store.find((m) => m.principale) ?? store[0])?.id ?? 1;
}

export function esisteMagazzino(id: number): boolean {
    return store.some((m) => m.id === id && m.attivo);
}

export async function fetchMagazzini(): Promise<Magazzino[]> {
    await delay();
    return structuredClone(store);
}

/** Impostare un principale toglie il flag agli altri (invariante: uno solo). */
function applicaPrincipale(id: number, principale: boolean) {
    if (!principale) return;
    for (const m of store) if (m.id !== id) m.principale = false;
}

export async function createMagazzino(data: MagazzinoFormValues): Promise<Magazzino> {
    await delay();
    if (store.some((m) => m.codice.toUpperCase() === data.codice.trim().toUpperCase())) throw new Error('Codice magazzino già esistente');
    const m: Magazzino = { ...data, codice: data.codice.trim().toUpperCase(), id: nextId++ };
    store.push(m);
    applicaPrincipale(m.id, m.principale);
    return structuredClone(m);
}

export async function updateMagazzino(id: number, data: MagazzinoFormValues): Promise<Magazzino> {
    await delay();
    const idx = store.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error('Magazzino non trovato');
    if (store[idx]!.principale && !data.principale) throw new Error('Scegli un altro magazzino come principale prima di togliere il flag');
    if (data.principale && !data.attivo) throw new Error('Il magazzino principale deve essere attivo');
    store[idx] = { ...store[idx]!, ...data, codice: data.codice.trim().toUpperCase() };
    applicaPrincipale(id, data.principale);
    return structuredClone(store[idx]!);
}

/** Eliminabile solo se non principale e senza giacenza (verifica a carico del chiamante). */
export async function deleteMagazzino(id: number, giacenzaResidua: number): Promise<void> {
    await delay();
    const m = store.find((x) => x.id === id);
    if (!m) return;
    if (m.principale) throw new Error('Il magazzino principale non si elimina');
    if (giacenzaResidua > 0) throw new Error('Il magazzino contiene merce: trasferiscila prima di eliminarlo');
    store.splice(store.indexOf(m), 1);
}
