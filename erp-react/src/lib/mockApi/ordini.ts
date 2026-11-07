// Mock "server state" degli ordini di vendita — stessa forma e stessa
// latenza simulata degli altri adapter, così TanStack Query non cambierà
// quando arriverà il backend reale.
//
// Differenza rispetto a clienti/fornitori/inventario: qui non c'è solo un
// CRUD. L'ordine ha un ciclo di vita, e ogni transizione può muovere il
// magazzino. Quella logica sta in questo modulo e non nella pagina, perché
// nel backend reale sarà una transazione server-side: se vivesse nel
// componente, andrebbe riscritta da capo al momento del passaggio.

import {
    DisponibilitaInsufficienteError, movimentaOrdine, ordineGiaMovimentato,
} from './inventario';
import { nomeCliente } from './clienti';
import {
    impegnaMagazzino, transizioneValida,
    type Ordine, type OrdineFormValues, type OrdineStato,
} from '../../types/ordine';

let nextId = 17;

// Gli ordini 1-6 sono quelli che compaiono già come causale nel registro
// movimenti di mockApi/inventario.ts (`ordineId`): il magazzino e le vendite
// raccontano lo stesso mese di lavoro, non due storie parallele.
//
// Invariante del dataset demo: un ordine in stato non terminale o ha i suoi
// movimenti nel registro, oppure è una bozza (che il magazzino non lo tocca).
// Così qualunque annullamento fatto dall'interfaccia storna esattamente ciò
// che era stato scaricato — vedi cambiaStatoOrdine().
const store: Ordine[] = [
    {
        id: 1, numero: 'ORD-3081', clienteId: 1, cliente: 'Rossi S.r.l.',
        data: '2026-08-05', consegna: '2026-08-12', stato: 'consegnato', priorita: 'normale',
        righe: [{ prodottoId: 1, sku: 'SKU-4501', nome: 'Widget Pro X200', unita: 'pz', quantita: 30, prezzo: 54, sconto: 0, iva: 22 }],
        note: 'Consegna presso magazzino di Segrate.',
    },
    {
        id: 2, numero: 'ORD-3086', clienteId: 5, cliente: 'Neri Logistica',
        data: '2026-08-10', consegna: '2026-08-14', stato: 'consegnato', priorita: 'normale',
        righe: [{ prodottoId: 11, sku: 'SKU-4511', nome: 'Striscia LED 5m IP65', unita: 'cf', quantita: 32, prezzo: 29, sconto: 5, iva: 22 }],
        note: '',
    },
    {
        id: 3, numero: 'ORD-3088', clienteId: 10, cliente: 'Celeste Pharma',
        data: '2026-08-11', consegna: '2026-08-21', stato: 'spedito', priorita: 'alta',
        righe: [{ prodottoId: 1, sku: 'SKU-4501', nome: 'Widget Pro X200', unita: 'pz', quantita: 45, prezzo: 54, sconto: 8, iva: 22 }],
        note: 'Documentazione di conformità richiesta in allegato.',
    },
    {
        id: 4, numero: 'ORD-3089', clienteId: 9, cliente: 'Grigio Metalli',
        data: '2026-08-15', consegna: '2026-08-22', stato: 'spedito', priorita: 'normale',
        righe: [{ prodottoId: 15, sku: 'SKU-4515', nome: 'Relè Statico 40A', unita: 'pz', quantita: 12, prezzo: 51, sconto: 0, iva: 22 }],
        note: '',
    },
    {
        id: 5, numero: 'ORD-3090', clienteId: 17, cliente: 'Smeraldo Energia',
        data: '2026-08-16', consegna: '2026-08-18', stato: 'in-preparazione', priorita: 'urgente',
        righe: [{ prodottoId: 3, sku: 'SKU-4503', nome: 'Pannello LED Ultra', unita: 'pz', quantita: 60, prezzo: 46, sconto: 3, iva: 22 }],
        note: 'Cantiere fermo in attesa della fornitura.',
    },
    {
        id: 6, numero: 'ORD-3092', clienteId: 14, cliente: 'Ocra Meccanica',
        data: '2026-08-17', consegna: '2026-08-24', stato: 'confermato', priorita: 'alta',
        righe: [{ prodottoId: 6, sku: 'SKU-4506', nome: 'Alimentatore DIN 24V', unita: 'pz', quantita: 22, prezzo: 79, sconto: 0, iva: 22 }],
        note: '',
    },
    {
        id: 7, numero: 'ORD-3082', clienteId: 20, cliente: 'Bronzo Trasporti',
        data: '2026-08-05', consegna: '2026-08-11', stato: 'consegnato', priorita: 'bassa',
        righe: [{ prodottoId: 20, sku: 'SKU-4520', nome: 'Guaina Spiralata 25mm', unita: 'm', quantita: 300, prezzo: 5.4, sconto: 10, iva: 22 }],
        note: '',
    },
    {
        id: 8, numero: 'ORD-3083', clienteId: 8, cliente: 'Viola Consulting',
        data: '2026-08-06', consegna: '2026-08-13', stato: 'consegnato', priorita: 'normale',
        righe: [
            { prodottoId: 5, sku: 'SKU-4505', nome: 'Adattatore USB-C Hub', unita: 'pz', quantita: 12, prezzo: 40, sconto: 0, iva: 22 },
            { prodottoId: 13, sku: 'SKU-4513', nome: 'Borsa Tecnica Pro', unita: 'pz', quantita: 3, prezzo: 62, sconto: 0, iva: 22 },
        ],
        note: '',
    },
    {
        id: 9, numero: 'ORD-3084', clienteId: 13, cliente: 'Corallo Alimentari',
        data: '2026-08-07', consegna: '2026-08-14', stato: 'annullato', priorita: 'normale',
        righe: [{ prodottoId: 21, sku: 'SKU-4521', nome: 'Plafoniera Stagna 36W', unita: 'pz', quantita: 25, prezzo: 44, sconto: 0, iva: 22 }],
        note: 'Annullato su richiesta del cliente: progetto rinviato.',
    },
    {
        id: 10, numero: 'ORD-3085', clienteId: 15, cliente: 'Ambra Tessuti',
        data: '2026-08-08', consegna: '2026-08-13', stato: 'consegnato', priorita: 'bassa',
        righe: [{ prodottoId: 18, sku: 'SKU-4518', nome: 'Kit Viteria Assortita', unita: 'cf', quantita: 40, prezzo: 18, sconto: 0, iva: 22 }],
        note: '',
    },
    {
        id: 11, numero: 'ORD-3087', clienteId: 6, cliente: 'Blu Tech Solutions',
        data: '2026-08-12', consegna: '2026-08-19', stato: 'consegnato', priorita: 'alta',
        righe: [
            { prodottoId: 17, sku: 'SKU-4517', nome: 'Access Point Wi-Fi 6', unita: 'pz', quantita: 8, prezzo: 168, sconto: 5, iva: 22 },
            { prodottoId: 8, sku: 'SKU-4508', nome: 'Switch Gigabit 24p', unita: 'pz', quantita: 2, prezzo: 219, sconto: 0, iva: 22 },
        ],
        note: 'Installazione a cura del cliente.',
    },
    {
        id: 12, numero: 'ORD-3091', clienteId: 19, cliente: 'Platino Medical',
        data: '2026-08-16', consegna: '2026-08-28', stato: 'annullato', priorita: 'urgente',
        righe: [{ prodottoId: 9, sku: 'SKU-4509', nome: 'Termocamera Compact', unita: 'pz', quantita: 2, prezzo: 620, sconto: 0, iva: 22 }],
        note: 'Gara non aggiudicata.',
    },
    {
        id: 13, numero: 'ORD-3093', clienteId: 2, cliente: 'Bianchi & Co.',
        data: '2026-08-18', consegna: '2026-08-27', stato: 'bozza', priorita: 'normale',
        righe: [
            { prodottoId: 4, sku: 'SKU-4504', nome: 'Cavo Cat.7 Premium', unita: 'm', quantita: 120, prezzo: 22, sconto: 0, iva: 22 },
            { prodottoId: 12, sku: 'SKU-4512', nome: 'Patch Panel 48p', unita: 'pz', quantita: 4, prezzo: 105, sconto: 0, iva: 22 },
        ],
        note: 'In attesa di conferma scritta.',
    },
    {
        id: 14, numero: 'ORD-3094', clienteId: 3, cliente: 'Verdi Elettronica',
        data: '2026-08-18', consegna: '', stato: 'bozza', priorita: 'bassa',
        righe: [
            { prodottoId: 14, sku: 'SKU-4514', nome: 'Multimetro TRMS', unita: 'pz', quantita: 6, prezzo: 149, sconto: 5, iva: 22 },
            { prodottoId: 2, sku: 'SKU-4502', nome: 'Sensore IoT Mk3', unita: 'pz', quantita: 10, prezzo: 44.1, sconto: 0, iva: 22 },
        ],
        note: '',
    },
    {
        id: 15, numero: 'ORD-3095', clienteId: 22, cliente: 'Titanio Aerospace',
        data: '2026-08-19', consegna: '2026-09-04', stato: 'bozza', priorita: 'alta',
        righe: [
            { prodottoId: 24, sku: 'SKU-4524', nome: 'Oscilloscopio 100MHz', unita: 'pz', quantita: 1, prezzo: 890, sconto: 0, iva: 22 },
            { prodottoId: 14, sku: 'SKU-4514', nome: 'Multimetro TRMS', unita: 'pz', quantita: 2, prezzo: 149, sconto: 0, iva: 22 },
        ],
        note: 'Richiesto certificato di taratura per entrambi gli strumenti.',
    },
    {
        id: 16, numero: 'ORD-3096', clienteId: 16, cliente: 'Indaco Software',
        data: '2026-08-19', consegna: '2026-08-26', stato: 'bozza', priorita: 'normale',
        righe: [{ prodottoId: 5, sku: 'SKU-4505', nome: 'Adattatore USB-C Hub', unita: 'pz', quantita: 5, prezzo: 40, sconto: 0, iva: 22 }],
        note: '',
    },
];

const LATENCY = 120;
const delay = () => new Promise((r) => setTimeout(r, LATENCY));

export async function fetchOrdini(): Promise<Ordine[]> {
    await delay();
    return store.slice();
}

/**
 * Un ordine nasce sempre in bozza: la conferma è un'operazione a sé, perché
 * è quella che muove il magazzino e può fallire per giacenza insufficiente.
 * Lasciar scegliere lo stato iniziale nel form significherebbe avere due
 * strade diverse per lo stesso effetto contabile.
 */
export async function createOrdine(data: OrdineFormValues): Promise<Ordine> {
    await delay();
    const ordine: Ordine = {
        ...data,
        id: nextId++,
        // Snapshot della ragione sociale risolto qui, come farà il backend
        // dentro la stessa transazione (vedi types/ordine.ts → RigaOrdine).
        cliente: nomeCliente(data.clienteId),
        stato: 'bozza',
        righe: data.righe.map((r) => ({ ...r })),
    };
    store.push(ordine);
    return ordine;
}

/**
 * La modifica è ammessa solo in bozza. Cambiare le righe di un ordine già
 * confermato scollegherebbe il documento dai movimenti che ha generato:
 * per farlo si annulla (con storno) e si riemette.
 */
export async function updateOrdine(id: number, data: OrdineFormValues): Promise<Ordine> {
    await delay();
    const idx = store.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Ordine non trovato');

    const corrente = store[idx]!;
    if (corrente.stato !== 'bozza') {
        throw new Error('Solo gli ordini in bozza possono essere modificati');
    }

    store[idx] = {
        ...corrente,
        ...data,
        cliente: nomeCliente(data.clienteId),
        righe: data.righe.map((r) => ({ ...r })),
    };
    return store[idx]!;
}

/**
 * L'eliminazione è ammessa su bozze e ordini annullati. Un ordine che ha
 * movimentato il magazzino resta agli atti: sparire lascerebbe nel registro
 * movimenti dei riferimenti a un documento inesistente.
 */
export async function deleteOrdine(id: number): Promise<void> {
    await delay();
    const idx = store.findIndex((o) => o.id === id);
    if (idx === -1) return;

    const stato = store[idx]!.stato;
    if (stato !== 'bozza' && stato !== 'annullato') {
        throw new Error('Un ordine già confermato non può essere eliminato');
    }
    store.splice(idx, 1);
}

/**
 * Transizione di stato — unico punto da cui lo stato di un ordine cambia.
 *
 * Il magazzino segue lo stato, non il contrario:
 * - si entra in uno stato impegnativo → scarico delle righe
 * - si esce da uno stato impegnativo verso l'annullamento → storno
 *
 * `ordineGiaMovimentato` protegge da doppio scarico e da doppio storno:
 * la verità su cosa è stato movimentato sta nel registro movimenti, non in
 * un flag sull'ordine che potrebbe divergere.
 */
export async function cambiaStatoOrdine(id: number, nuovo: OrdineStato): Promise<Ordine> {
    const idx = store.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Ordine non trovato');

    const ordine = store[idx]!;
    if (!transizioneValida(ordine.stato, nuovo)) {
        throw new Error(`Transizione non ammessa: ${ordine.stato} → ${nuovo}`);
    }

    const eraImpegnativo = impegnaMagazzino(ordine.stato);
    const saraImpegnativo = impegnaMagazzino(nuovo);

    // Lo scarico avviene prima di scrivere il nuovo stato: se la giacenza
    // non basta, movimentaOrdine lancia e l'ordine resta dov'era.
    if (!eraImpegnativo && saraImpegnativo && !ordineGiaMovimentato(id, 'scarico')) {
        await movimentaOrdine({
            ordineId: id,
            numero: ordine.numero,
            righe: ordine.righe.map((r) => ({ prodottoId: r.prodottoId, quantita: r.quantita })),
            tipo: 'scarico',
            data: ordine.data,
        });
    } else if (eraImpegnativo && !saraImpegnativo
        && ordineGiaMovimentato(id, 'scarico') && !ordineGiaMovimentato(id, 'carico')) {
        await movimentaOrdine({
            ordineId: id,
            numero: ordine.numero,
            righe: ordine.righe.map((r) => ({ prodottoId: r.prodottoId, quantita: r.quantita })),
            tipo: 'carico',
            data: ordine.data,
        });
    } else {
        await delay();
    }

    store[idx] = { ...ordine, stato: nuovo };
    return store[idx]!;
}

export { DisponibilitaInsufficienteError };
