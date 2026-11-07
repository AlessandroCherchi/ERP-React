// Mock "server state" del magazzino — stessa forma e stessa latenza
// simulata di mockApi/clienti.ts, così TanStack Query non cambierà
// quando arriverà il backend reale.
//
// TODO(step Backend, spec §4/§5): sostituire con client HTTP su
// /api/v1/prodotti e /api/v1/movimenti, stesso envelope ApiResponse
// e stessa firma delle funzioni.

import { applicaMovimento, type Movimento, type MovimentoTipo, type Prodotto } from '../../types/prodotto';
import type { ProdottoForm } from '../../types/quickActions';
import { parseNum } from '../format';
import { collection, delay, nextIdOf } from './db';


// I primi 5 articoli sono gli stessi "Top Prodotti" della Dashboard:
// le due pagine raccontano lo stesso magazzino.
const SEED_PRODOTTI: Prodotto[] = [
    { id: 1, sku: 'SKU-4501', nome: 'Widget Pro X200', categoria: 'Elettronica', fornitoreId: 1, costo: 32, prezzo: 54, giacenza: 218, scorta: 40, unita: 'pz', iva: 22, ubicazione: 'A-01-2', descrizione: 'Modulo di controllo industriale con display OLED e connettività Modbus.' },
    { id: 2, sku: 'SKU-4502', nome: 'Sensore IoT Mk3', categoria: 'Componenti', fornitoreId: 2, costo: 18.5, prezzo: 44.1, giacenza: 156, scorta: 30, unita: 'pz', iva: 22, ubicazione: 'A-03-1', descrizione: 'Sensore ambientale multiparametro con radio LoRaWAN integrata.' },
    { id: 3, sku: 'SKU-4503', nome: 'Pannello LED Ultra', categoria: 'Illuminazione', fornitoreId: 3, costo: 26, prezzo: 46, giacenza: 24, scorta: 35, unita: 'pz', iva: 22, ubicazione: 'B-02-4', descrizione: 'Pannello 60x60 4000K, 40W, driver dimmerabile DALI.' },
    { id: 4, sku: 'SKU-4504', nome: 'Cavo Cat.7 Premium', categoria: 'Networking', fornitoreId: 4, costo: 11, prezzo: 22, giacenza: 640, scorta: 100, unita: 'm', iva: 22, ubicazione: 'C-05-1', descrizione: 'Cavo S/FTP schermato 10Gbps, guaina LSZH, matassa da 100 m.' },
    { id: 5, sku: 'SKU-4505', nome: 'Adattatore USB-C Hub', categoria: 'Accessori', fornitoreId: 1, costo: 21, prezzo: 40, giacenza: 92, scorta: 25, unita: 'pz', iva: 22, ubicazione: 'D-01-3', descrizione: 'Hub 7-in-1 con HDMI 4K60, PD 100W e lettore SD.' },
    { id: 6, sku: 'SKU-4506', nome: 'Alimentatore DIN 24V', categoria: 'Componenti', fornitoreId: 2, costo: 44, prezzo: 79, giacenza: 0, scorta: 15, unita: 'pz', iva: 22, ubicazione: 'A-04-2', descrizione: 'Alimentatore da barra DIN 24Vdc 5A, ingresso universale.' },
    { id: 7, sku: 'SKU-4507', nome: 'Faretto Binario 30W', categoria: 'Illuminazione', fornitoreId: 3, costo: 19, prezzo: 38, giacenza: 210, scorta: 40, unita: 'pz', iva: 22, ubicazione: 'B-01-1', descrizione: 'Faretto orientabile per binario trifase, ottica 36°, CRI>90.' },
    { id: 8, sku: 'SKU-4508', nome: 'Switch Gigabit 24p', categoria: 'Networking', fornitoreId: 4, costo: 128, prezzo: 219, giacenza: 34, scorta: 10, unita: 'pz', iva: 22, ubicazione: 'C-01-2', descrizione: 'Switch managed L2+, 24 porte PoE+, budget 370W.' },
    { id: 9, sku: 'SKU-4509', nome: 'Termocamera Compact', categoria: 'Elettronica', fornitoreId: 6, costo: 380, prezzo: 620, giacenza: 8, scorta: 5, unita: 'pz', iva: 22, ubicazione: 'A-06-1', descrizione: 'Termocamera 256x192, range -20/+550 °C, certificato di taratura.' },
    { id: 10, sku: 'SKU-4510', nome: 'Morsettiera 12 vie', categoria: 'Componenti', fornitoreId: 2, costo: 3.2, prezzo: 7.5, giacenza: 1240, scorta: 200, unita: 'pz', iva: 22, ubicazione: 'A-02-5', descrizione: 'Morsettiera a vite 12 poli, 450V 24A, materiale autoestinguente.' },
    { id: 11, sku: 'SKU-4511', nome: 'Striscia LED 5m IP65', categoria: 'Illuminazione', fornitoreId: 3, costo: 14, prezzo: 29, giacenza: 18, scorta: 20, unita: 'cf', iva: 22, ubicazione: 'B-03-2', descrizione: 'Striscia 24V 14,4W/m, 3000K, silicone IP65, bobina da 5 m.' },
    { id: 12, sku: 'SKU-4512', nome: 'Patch Panel 48p', categoria: 'Networking', fornitoreId: 4, costo: 62, prezzo: 105, giacenza: 46, scorta: 12, unita: 'pz', iva: 22, ubicazione: 'C-02-1', descrizione: 'Patch panel 19" 2U Cat.6A schermato, con guida passacavi.' },
    { id: 13, sku: 'SKU-4513', nome: 'Borsa Tecnica Pro', categoria: 'Accessori', fornitoreId: 5, costo: 34, prezzo: 62, giacenza: 73, scorta: 15, unita: 'pz', iva: 22, ubicazione: 'D-02-1', descrizione: 'Borsa porta-utensili in cordura con fondo rigido e tasche modulari.' },
    { id: 14, sku: 'SKU-4514', nome: 'Multimetro TRMS', categoria: 'Elettronica', fornitoreId: 6, costo: 88, prezzo: 149, giacenza: 41, scorta: 10, unita: 'pz', iva: 22, ubicazione: 'A-05-3', descrizione: 'Multimetro CAT III 600V, true RMS, misura capacità e temperatura.' },
    { id: 15, sku: 'SKU-4515', nome: 'Relè Statico 40A', categoria: 'Componenti', fornitoreId: 2, costo: 27, prezzo: 51, giacenza: 0, scorta: 12, unita: 'pz', iva: 22, ubicazione: 'A-04-4', descrizione: 'Relè a stato solido 40A 480Vac, comando 3-32Vdc, con dissipatore.' },
    { id: 16, sku: 'SKU-4516', nome: 'Proiettore Esterno 100W', categoria: 'Illuminazione', fornitoreId: 3, costo: 42, prezzo: 78, giacenza: 128, scorta: 25, unita: 'pz', iva: 22, ubicazione: 'B-04-1', descrizione: 'Proiettore LED IP66 100W 5000K, staffa regolabile in acciaio inox.' },
    { id: 17, sku: 'SKU-4517', nome: 'Access Point Wi-Fi 6', categoria: 'Networking', fornitoreId: 4, costo: 96, prezzo: 168, giacenza: 22, scorta: 25, unita: 'pz', iva: 22, ubicazione: 'C-03-2', descrizione: 'AP dual-band AX3000 PoE, gestione cloud, montaggio a soffitto.' },
    { id: 18, sku: 'SKU-4518', nome: 'Kit Viteria Assortita', categoria: 'Accessori', fornitoreId: 5, costo: 8.5, prezzo: 18, giacenza: 315, scorta: 60, unita: 'cf', iva: 22, ubicazione: 'D-03-4', descrizione: 'Assortimento 1000 pezzi in valigetta: viti, dadi e rondelle inox A2.' },
    { id: 19, sku: 'SKU-4519', nome: 'PLC Compatto 16 I/O', categoria: 'Elettronica', fornitoreId: 1, costo: 210, prezzo: 349, giacenza: 15, scorta: 6, unita: 'pz', iva: 22, ubicazione: 'A-07-1', descrizione: 'Controllore programmabile 16 I/O digitali, Ethernet/IP e Modbus TCP.' },
    { id: 20, sku: 'SKU-4520', nome: 'Guaina Spiralata 25mm', categoria: 'Componenti', fornitoreId: 4, costo: 2.1, prezzo: 5.4, giacenza: 880, scorta: 150, unita: 'm', iva: 22, ubicazione: 'A-08-2', descrizione: 'Guaina spiralata in polietilene per fasciatura cablaggi, Ø 25 mm.' },
    { id: 21, sku: 'SKU-4521', nome: 'Plafoniera Stagna 36W', categoria: 'Illuminazione', fornitoreId: 3, costo: 23, prezzo: 44, giacenza: 264, scorta: 50, unita: 'pz', iva: 22, ubicazione: 'B-02-1', descrizione: 'Plafoniera IP65 1200 mm 36W 4000K per ambienti industriali.' },
    { id: 22, sku: 'SKU-4522', nome: 'Router VPN Business', categoria: 'Networking', fornitoreId: 4, costo: 145, prezzo: 249, giacenza: 9, scorta: 8, unita: 'pz', iva: 22, ubicazione: 'C-04-3', descrizione: 'Router con firewall SPI, 20 tunnel IPsec e failover 4G opzionale.' },
    { id: 23, sku: 'SKU-4523', nome: 'Avvitatore 18V 2 batterie', categoria: 'Accessori', fornitoreId: 5, costo: 118, prezzo: 199, giacenza: 27, scorta: 8, unita: 'pz', iva: 22, ubicazione: 'D-04-2', descrizione: 'Trapano avvitatore brushless 18V con 2 batterie 4Ah e valigetta.' },
    { id: 24, sku: 'SKU-4524', nome: 'Oscilloscopio 100MHz', categoria: 'Elettronica', fornitoreId: 6, costo: 540, prezzo: 890, giacenza: 4, scorta: 3, unita: 'pz', iva: 22, ubicazione: 'A-09-1', descrizione: 'Oscilloscopio 2 canali 100 MHz, 1 GSa/s, display 7" con decodifica seriale.' },
    { id: 25, sku: 'SKU-4525', nome: 'Contattore Tripolare 25A', categoria: 'Componenti', fornitoreId: 2, costo: 16.4, prezzo: 33, giacenza: 0, scorta: 20, unita: 'pz', iva: 22, ubicazione: 'A-03-4', descrizione: 'Contattore 3P 25A AC-3, bobina 230Vac, contatto ausiliario NA.' },
    { id: 26, sku: 'SKU-4526', nome: 'Etichettatrice Industriale', categoria: 'Accessori', fornitoreId: 5, costo: 168, prezzo: 279, giacenza: 11, scorta: 4, unita: 'pz', iva: 22, ubicazione: 'D-05-1', descrizione: 'Etichettatrice termica per cavi e quadri, tastiera QWERTY, nastro 12 mm.' },
];

// Storico movimenti: solo per gli articoli più movimentati (gli altri
// mostrano l'empty state nel pannello dettaglio, come in produzione).
const SEED_MOVIMENTI: Movimento[] = [
    { id: 1, prodottoId: 1, tipo: 'carico', quantita: 120, causale: 'Ordine fornitore #F-2291', data: '2026-08-14', giacenzaFinale: 218, note: 'Consegna completa, merce conforme.' },
    { id: 2, prodottoId: 1, tipo: 'scarico', quantita: 45, causale: 'Ordine cliente ORD-3088', data: '2026-08-11', giacenzaFinale: 98, note: '', ordineId: 3 },
    { id: 3, prodottoId: 1, tipo: 'scarico', quantita: 30, causale: 'Ordine cliente ORD-3081', data: '2026-08-05', giacenzaFinale: 143, note: '', ordineId: 1 },
    { id: 4, prodottoId: 3, tipo: 'scarico', quantita: 60, causale: 'Ordine cliente ORD-3090', data: '2026-08-16', giacenzaFinale: 24, note: 'Scorta sotto soglia: valutare riordino.', ordineId: 5 },
    { id: 5, prodottoId: 3, tipo: 'carico', quantita: 50, causale: 'Ordine fornitore #F-2280', data: '2026-08-02', giacenzaFinale: 84, note: '' },
    { id: 6, prodottoId: 6, tipo: 'scarico', quantita: 22, causale: 'Ordine cliente ORD-3092', data: '2026-08-17', giacenzaFinale: 0, note: 'Articolo esaurito, riordino urgente.', ordineId: 6 },
    { id: 7, prodottoId: 4, tipo: 'carico', quantita: 400, causale: 'Ordine fornitore #F-2295', data: '2026-08-13', giacenzaFinale: 640, note: '' },
    { id: 8, prodottoId: 11, tipo: 'scarico', quantita: 32, causale: 'Ordine cliente ORD-3086', data: '2026-08-10', giacenzaFinale: 18, note: '', ordineId: 2 },
    { id: 9, prodottoId: 15, tipo: 'scarico', quantita: 12, causale: 'Ordine cliente ORD-3089', data: '2026-08-15', giacenzaFinale: 0, note: '', ordineId: 4 },
    { id: 10, prodottoId: 9, tipo: 'rettifica', quantita: 8, causale: 'Inventario fisico Q3', data: '2026-08-01', giacenzaFinale: 8, note: 'Allineamento dopo conta fisica.' },
];

const store = collection('prodotti', SEED_PRODOTTI);
const movimenti = collection('movimenti', SEED_MOVIMENTI);
let nextId = nextIdOf(store);
let nextMovimentoId = nextIdOf(movimenti);


/** Converte i valori string del form nei tipi numerici del dominio. */
function fromForm(data: ProdottoForm): Omit<Prodotto, 'id'> {
    return {
        sku: data.sku.trim(),
        nome: data.nome.trim(),
        categoria: data.categoria,
        fornitoreId: data.fornitoreId ? Number(data.fornitoreId) : null,
        costo: parseNum(data.costo),
        prezzo: parseNum(data.prezzo),
        giacenza: parseNum(data.giacenza),
        scorta: parseNum(data.scorta),
        unita: data.unita,
        iva: parseNum(data.iva),
        ubicazione: data.ubicazione.trim(),
        descrizione: data.descrizione.trim(),
    };
}

export async function fetchProdotti(): Promise<Prodotto[]> {
    await delay();
    return store.slice();
}

export async function fetchMovimenti(): Promise<Movimento[]> {
    await delay();
    return movimenti.slice();
}

export async function createProdotto(data: ProdottoForm): Promise<Prodotto> {
    await delay();
    const prodotto: Prodotto = { ...fromForm(data), id: nextId++ };
    store.push(prodotto);
    return prodotto;
}

export async function updateProdotto(id: number, data: ProdottoForm): Promise<Prodotto> {
    await delay();
    const idx = store.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Prodotto non trovato');
    store[idx] = { ...store[idx]!, ...fromForm(data) };
    return store[idx]!;
}

export async function deleteProdotto(id: number): Promise<void> {
    await delay();
    const idx = store.findIndex((p) => p.id === id);
    if (idx !== -1) store.splice(idx, 1);
}

export interface RettificaInput {
    prodottoId: number;
    tipo: MovimentoTipo;
    quantita: number;
    causale: string;
    data: string;
    note: string;
}

/**
 * Registra un movimento e aggiorna la giacenza in modo atomico.
 * Il nuovo saldo è calcolato con applicaMovimento(), la stessa funzione
 * usata dall'anteprima nel modale: preview e persistenza non divergono.
 */
export async function registraMovimento(input: RettificaInput): Promise<Prodotto> {
    await delay();
    const idx = store.findIndex((p) => p.id === input.prodottoId);
    if (idx === -1) throw new Error('Prodotto non trovato');

    const prodotto = store[idx]!;
    const giacenzaFinale = applicaMovimento(prodotto.giacenza, input.tipo, input.quantita);

    store[idx] = { ...prodotto, giacenza: giacenzaFinale };
    movimenti.unshift({
        id: nextMovimentoId++,
        prodottoId: input.prodottoId,
        tipo: input.tipo,
        quantita: input.quantita,
        causale: input.causale,
        data: input.data,
        giacenzaFinale,
        note: input.note,
    });

    return store[idx]!;
}

// ------------------------- EVASIONE ORDINI -------------------------
// Il magazzino è l'unico proprietario delle giacenze: la pagina Vendite non
// scrive mai `giacenza` direttamente, chiede a questo modulo di movimentare
// le righe di un ordine. Così il registro movimenti resta l'unica storia di
// come la quantità è cambiata, esattamente come per i carichi manuali.

export interface RigaDaEvadere {
    prodottoId: number;
    quantita: number;
}

/** Riga che la giacenza attuale non riesce a coprire. */
export interface Scoperto {
    prodottoId: number;
    nome: string;
    richiesta: number;
    disponibile: number;
}

/** Somma le quantità per articolo: due righe sullo stesso prodotto pesano insieme. */
function aggrega(righe: RigaDaEvadere[]): Map<number, number> {
    const map = new Map<number, number>();
    for (const r of righe) map.set(r.prodottoId, (map.get(r.prodottoId) ?? 0) + r.quantita);
    return map;
}

/**
 * Righe non evadibili con la giacenza attuale.
 * Esposta a parte perché l'interfaccia deve poterlo dire *prima* del
 * salvataggio (badge nell'editor righe), non solo scoprirlo dall'errore.
 */
export function verificaDisponibilita(righe: RigaDaEvadere[]): Scoperto[] {
    const scoperti: Scoperto[] = [];
    for (const [prodottoId, richiesta] of aggrega(righe)) {
        const p = store.find((x) => x.id === prodottoId);
        if (!p) continue;
        if (p.giacenza < richiesta) {
            scoperti.push({ prodottoId, nome: p.nome, richiesta, disponibile: p.giacenza });
        }
    }
    return scoperti;
}

export interface MovimentoOrdineInput {
    ordineId: number;
    /** Numero documento, finisce nella causale del movimento. */
    numero: string;
    righe: RigaDaEvadere[];
    /** scarico = conferma ordine, carico = storno per annullamento. */
    tipo: 'scarico' | 'carico';
    data: string;
}

/** Errore di dominio: la conferma è stata rifiutata per giacenza insufficiente. */
export class DisponibilitaInsufficienteError extends Error {
    readonly scoperti: Scoperto[];

    constructor(scoperti: Scoperto[]) {
        super('Giacenza insufficiente');
        this.name = 'DisponibilitaInsufficienteError';
        this.scoperti = scoperti;
    }
}

/**
 * Movimenta in blocco le righe di un ordine — tutto o niente.
 * La verifica precede qualsiasi scrittura: un ordine di dieci righe di cui
 * una scoperta non deve lasciare nove articoli scaricati e il documento
 * ancora in bozza. È la ragione per cui questa operazione non può essere
 * un ciclo di registraMovimento() lato chiamante.
 *
 * TODO(step Backend): diventerà una singola transazione server-side; qui la
 * atomicità è garantita solo dal fatto che il codice è sincrono.
 */
export async function movimentaOrdine(input: MovimentoOrdineInput): Promise<void> {
    await delay();

    if (input.tipo === 'scarico') {
        const scoperti = verificaDisponibilita(input.righe);
        if (scoperti.length) throw new DisponibilitaInsufficienteError(scoperti);
    }

    const causale = input.tipo === 'scarico'
        ? `Ordine cliente ${input.numero}`
        : `Storno ordine ${input.numero}`;

    for (const [prodottoId, quantita] of aggrega(input.righe)) {
        const idx = store.findIndex((p) => p.id === prodottoId);
        // Articolo eliminato dal catalogo dopo l'emissione dell'ordine: la
        // riga resta nel documento (è uno snapshot) ma non c'è più nulla da
        // movimentare.
        if (idx === -1) continue;

        const prodotto = store[idx]!;
        const giacenzaFinale = applicaMovimento(prodotto.giacenza, input.tipo, quantita);
        store[idx] = { ...prodotto, giacenza: giacenzaFinale };

        movimenti.unshift({
            id: nextMovimentoId++,
            prodottoId,
            tipo: input.tipo,
            quantita,
            causale,
            data: input.data,
            giacenzaFinale,
            note: '',
            ordineId: input.ordineId,
        });
    }
}

/** True se l'ordine ha già movimentato il magazzino nel verso indicato. */
export function ordineGiaMovimentato(ordineId: number, tipo: 'scarico' | 'carico'): boolean {
    return movimenti.some((m) => m.ordineId === ordineId && m.tipo === tipo);
}
