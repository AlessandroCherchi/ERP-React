// Mock fatture e incassi. Simula il comportamento del backend fiscale:
// numerazione all'emissione (progressivo per anno, senza buchi), invio allo
// SDI con esito, vincoli di immutabilità dei documenti emessi.
// TODO(step Backend, spec §11): contratto FatturaPA/SDI versionato lato server.

import { collection, delay, nextIdOf } from './db';
import { ordiniSnapshot } from './ordini';
import { snapshotCliente } from './clienti';
import { getConfig } from '../../config/configStore';
import { formatNumber } from '../../config/numbering';
import { today } from '../format';
import {
    fatturaInviabile, fatturaModificabile, ordiniGiaFatturati, righeDaOrdini, situazione,
    type Fattura, type FatturaFormValues, type Incasso,
} from '../../types/fattura';

function seed(): Fattura[] {
    const ordini = ordiniSnapshot();
    const da = (ordineId: number) => ordini.find((o) => o.id === ordineId)!;
    const base = (id: number, ordineId: number, numero: string, data: string, sdi: Fattura['sdi'], extra: Partial<Fattura> = {}): Fattura => {
        const o = da(ordineId);
        return {
            id, numero, tipo: 'TD01', clienteId: o.clienteId, cliente: snapshotCliente(o.clienteId), data,
            terminiPagamento: '30', metodoPagamento: 'bonifico', righe: righeDaOrdini([o]), ordineIds: [ordineId],
            stato: 'emessa', sdi, note: '', ...extra,
        };
    };
    return [
        base(1, 1, '2026/0139', '2026-08-12', 'consegnata', { terminiPagamento: '60' }),
        base(2, 2, '2026/0140', '2026-08-14', 'consegnata'),
        base(3, 7, '2026/0141', '2026-08-11', 'consegnata', { metodoPagamento: 'riba' }),
        base(4, 8, '2026/0142', '2026-08-13', 'scartata', {
            esitoSdi: { codice: '00305', descrizione: 'IdFiscaleIVA del cessionario non valido', data: '2026-08-13' },
        }),
    ];
}

const SEED_INCASSI: Incasso[] = [
    { id: 1, fatturaId: 1, data: '2026-09-30', importo: 0, metodo: 'bonifico', note: 'Saldo' },
    { id: 2, fatturaId: 2, data: '2026-09-10', importo: 500, metodo: 'bonifico', note: 'Acconto' },
];

const store = collection('fatture', seed());
// L'incasso di saldo della fattura 1 vale il suo totale: calcolato, non scritto a mano.
const incassi = collection('incassi', SEED_INCASSI.map((i) =>
    i.fatturaId === 1 ? { ...i, importo: situazione(store[0]!, [], [], today()).totale } : i));
let nextId = nextIdOf(store);
let nextIncassoId = nextIdOf(incassi);

const clone = <T>(x: T): T => structuredClone(x);
const trova = (id: number) => {
    const idx = store.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error('Documento non trovato');
    return idx;
};

export async function fetchFatture(): Promise<Fattura[]> {
    await delay();
    return clone(store);
}

export async function fetchIncassi(): Promise<Incasso[]> {
    await delay();
    return clone(incassi);
}

export async function createFattura(data: FatturaFormValues): Promise<Fattura> {
    await delay();
    const fatturati = ordiniGiaFatturati(store);
    const doppi = (data.ordineIds ?? []).filter((id) => fatturati.has(id));
    if (doppi.length) throw new Error('Uno o più ordini risultano già fatturati');
    const f: Fattura = {
        ...data,
        id: nextId++,
        numero: null,
        cliente: snapshotCliente(data.clienteId),
        ordineIds: data.ordineIds ?? [],
        stato: 'bozza',
        sdi: 'da-inviare',
    };
    store.push(f);
    return clone(f);
}

export async function updateFattura(id: number, data: FatturaFormValues): Promise<Fattura> {
    await delay();
    const idx = trova(id);
    if (!fatturaModificabile(store[idx]!)) throw new Error('Un documento emesso non è modificabile: emetti una nota di credito');
    store[idx] = { ...store[idx]!, ...data, cliente: snapshotCliente(data.clienteId), ordineIds: data.ordineIds ?? store[idx]!.ordineIds };
    return clone(store[idx]!);
}

export async function deleteFattura(id: number): Promise<void> {
    await delay();
    const idx = trova(id);
    if (!fatturaModificabile(store[idx]!)) throw new Error('Un documento emesso non si elimina');
    store.splice(idx, 1);
}

/**
 * Emissione: assegna il numero fiscale (progressivo annuale, unico per tutti
 * i tipi documento) e rende il documento immutabile. Lato backend sarà una
 * transazione con lock sul sezionale (spec §11: mai offline-optimistic).
 */
export async function emettiFattura(id: number): Promise<Fattura> {
    await delay();
    const idx = trova(id);
    const f = store[idx]!;
    if (!fatturaModificabile(f)) throw new Error('Documento già emesso');
    const anno = f.data.slice(0, 4);
    const rule = getConfig().numbering.fattura;
    const max = store
        .filter((x) => x.numero?.startsWith(`${anno}/`))
        .reduce((m, x) => Math.max(m, Number(x.numero!.split('/')[1]!.replace(/\D/g, '')) || 0), rule.start);
    store[idx] = { ...f, numero: `${anno}/${formatNumber(rule, max + 1)}`, stato: 'emessa', sdi: 'da-inviare' };
    return clone(store[idx]!);
}

/**
 * Invio allo SDI (simulato). Regole di scarto riprodotte dal mock, con i
 * codici reali delle notifiche di scarto:
 * - 00305: partita IVA del cessionario formalmente non valida;
 * - 00311: né codice destinatario né PEC (consegna impossibile → mancata consegna).
 */
export async function inviaSdi(id: number): Promise<Fattura> {
    await delay(400);
    const idx = trova(id);
    const f = store[idx]!;
    if (!fatturaInviabile(f)) throw new Error('Documento non inviabile');
    const cliente = snapshotCliente(f.clienteId); // reinvio dopo correzione anagrafica
    const oggi = today();
    let next: Fattura = { ...f, cliente, esitoSdi: undefined };
    if (cliente.piva && !/^IT\d{11}$/.test(cliente.piva)) {
        next = { ...next, sdi: 'scartata', esitoSdi: { codice: '00305', descrizione: 'IdFiscaleIVA del cessionario non valido', data: oggi } };
    } else if (!cliente.sdi && !cliente.pec) {
        next = { ...next, sdi: 'mancata-consegna', esitoSdi: { codice: 'MC', descrizione: 'Recapito non disponibile: fattura nel cassetto fiscale del cliente', data: oggi } };
    } else {
        next = { ...next, sdi: 'consegnata', esitoSdi: { codice: 'RC', descrizione: 'Ricevuta di consegna', data: oggi } };
    }
    store[idx] = next;
    return clone(next);
}

export interface IncassoInput {
    fatturaId: number;
    data: string;
    importo: number;
    metodo: string;
    note: string;
}

/** Registra un incasso: mai oltre il residuo (un eccesso va gestito come acconto/NC). */
export async function registraIncasso(input: IncassoInput): Promise<Incasso> {
    await delay();
    const f = store[trova(input.fatturaId)]!;
    if (f.stato !== 'emessa' || f.tipo === 'TD04') throw new Error('Si incassano solo fatture emesse');
    const { residuo } = situazione(f, incassi, store, input.data);
    if (input.importo <= 0) throw new Error('Importo non valido');
    if (input.importo > residuo + 1e-9) throw new Error(`L'importo supera il residuo da incassare`);
    const incasso: Incasso = { ...input, id: nextIncassoId++ };
    incassi.push(incasso);
    return clone(incasso);
}

export async function eliminaIncasso(id: number): Promise<void> {
    await delay();
    const idx = incassi.findIndex((i) => i.id === id);
    if (idx !== -1) incassi.splice(idx, 1);
}
