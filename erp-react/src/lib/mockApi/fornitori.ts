// Mock "server state" dei fornitori — stessa forma e stessa latenza simulata
// di mockApi/clienti.ts, così TanStack Query non cambierà quando arriverà il
// backend reale.
//
// I primi cinque nomi sono esattamente quelli già usati come `fornitore` in
// mockApi/inventario.ts: le due pagine parlano dello stesso parco fornitori.
//
// TODO(step Backend, spec §4/§5): sostituire con client HTTP su
// /api/v1/fornitori, stesso envelope ApiResponse.

import type { Fornitore, FornitoreFormValues } from '../../types/fornitore';
import { collection, nextIdOf } from './db';


const SEED: Fornitore[] = [
    { id: 1, nome: 'Tecnoforniture S.p.A.', email: 'ordini@tecnoforniture.it', telefono: '+39 02 5566778', citta: 'Milano', provincia: 'MI', indirizzo: 'Via Mecenate 90', piva: 'IT02233445566', cf: '02233445566', pec: 'tecnoforniture@pec.it', sdi: 'TFR1234', note: 'Fornitore principale elettronica. Sconto 8% sopra i 5.000 €.', stato: 'attivo', categoria: 'Elettronica', pagamento: '60', leadTime: 7, iban: 'IT60X0542811101000000123456', acquistato: 128400, ordini: 64, debito: 12300 },
    { id: 2, nome: 'Elettromeccanica Nord', email: 'acquisti@elettronord.it', telefono: '+39 035 4455667', citta: 'Bergamo', provincia: 'BG', indirizzo: 'Via Grumello 22', piva: 'IT03344556677', cf: '03344556677', pec: 'elettronord@pec.it', sdi: 'ELN5678', note: 'Componentistica su specifica. Lead time variabile in agosto.', stato: 'attivo', categoria: 'Componenti', pagamento: '30', leadTime: 12, iban: 'IT22K0300203280000400123457', acquistato: 96750, ordini: 51, debito: 8400 },
    { id: 3, nome: 'LuceItalia S.r.l.', email: 'commerciale@luceitalia.it', telefono: '+39 051 3344556', citta: 'Bologna', provincia: 'BO', indirizzo: 'Via Emilia 145', piva: 'IT04455667788', cf: '04455667788', pec: 'luceitalia@pec.it', sdi: 'LCI9012', note: '', stato: 'attivo', categoria: 'Illuminazione', pagamento: '60', leadTime: 5, iban: 'IT91L0306901234100000012345', acquistato: 74200, ordini: 43, debito: 5100 },
    { id: 4, nome: 'CableTech Italia', email: 'info@cabletech.it', telefono: '+39 011 7788990', citta: 'Torino', provincia: 'TO', indirizzo: 'Corso Regina 210', piva: 'IT05566778899', cf: '05566778899', pec: 'cabletech@pec.it', sdi: 'CBT3456', note: 'Consegne settimanali programmate il martedì.', stato: 'attivo', categoria: 'Networking', pagamento: '30', leadTime: 4, iban: 'IT43W0200801234000103456789', acquistato: 61300, ordini: 38, debito: 3900 },
    { id: 5, nome: 'Utensili Rapidi', email: 'vendite@utensilirapidi.it', telefono: '+39 030 2233445', citta: 'Brescia', provincia: 'BS', indirizzo: 'Via Industriale 8', piva: 'IT06677889900', cf: '06677889900', pec: 'utensilirapidi@pec.it', sdi: 'UTR7890', note: '', stato: 'attivo', categoria: 'Accessori', pagamento: '30', leadTime: 3, iban: 'IT77H0103012345000000234567', acquistato: 38900, ordini: 29, debito: 1600 },
    { id: 6, nome: 'Strumentazione Sud', email: 'ordini@strumentazionesud.it', telefono: '+39 081 9988776', citta: 'Napoli', provincia: 'NA', indirizzo: 'Via Argine 310', piva: 'IT07788990011', cf: '07788990011', pec: 'strumsud@pec.it', sdi: 'STS2345', note: 'Strumenti con certificato di taratura. Lead time lungo.', stato: 'attivo', categoria: 'Elettronica', pagamento: '90', leadTime: 21, iban: 'IT15P0101503200000000345678', acquistato: 52600, ordini: 18, debito: 9800 },
    { id: 7, nome: 'Plastika Veneta', email: 'info@plastikaveneta.it', telefono: '+39 049 5566443', citta: 'Padova', provincia: 'PD', indirizzo: 'Via Uruguay 15', piva: 'IT08899001122', cf: '08899001122', pec: 'plastika@pec.it', sdi: 'PLV6789', note: 'Rapporto sospeso: contestazione qualità lotto 2026/14.', stato: 'sospeso', categoria: 'Componenti', pagamento: '30', leadTime: 9, iban: 'IT38U0526802000000000456789', acquistato: 21400, ordini: 12, debito: 4600 },
    { id: 8, nome: 'Metalli Adriatica', email: 'acquisti@metalliadriatica.it', telefono: '+39 071 3344221', citta: 'Ancona', provincia: 'AN', indirizzo: 'Via Flaminia 88', piva: 'IT09900112233', cf: '09900112233', pec: 'adriatica@pec.it', sdi: 'MTA0123', note: '', stato: 'attivo', categoria: 'Componenti', pagamento: '60', leadTime: 14, iban: 'IT60X0542811101000000567890', acquistato: 44700, ordini: 26, debito: 7200 },
    { id: 9, nome: 'Imballaggi Toscani', email: 'ordini@imballaggitoscani.it', telefono: '+39 055 2211334', citta: 'Firenze', provincia: 'FI', indirizzo: 'Via Pratese 40', piva: 'IT10011223344', cf: '10011223344', pec: 'imbtoscani@pec.it', sdi: 'IMT4567', note: '', stato: 'attivo', categoria: 'Accessori', pagamento: '30', leadTime: 6, iban: 'IT02Y0306902114100000012399', acquistato: 18200, ordini: 33, debito: 900 },
    { id: 10, nome: 'Sicurezza & Lavoro', email: 'info@sicurezzalavoro.it', telefono: '+39 06 8877665', citta: 'Roma', provincia: 'RM', indirizzo: 'Via Portuense 501', piva: 'IT11122334455', cf: '11122334455', pec: 'siclav@pec.it', sdi: 'SEL8901', note: 'DPI e formazione. Rinnovo contratto a gennaio.', stato: 'attivo', categoria: 'Accessori', pagamento: '30', leadTime: 5, iban: 'IT48Z0300203280000400987654', acquistato: 12800, ordini: 21, debito: 400 },
    { id: 11, nome: 'Cavi & Connettori Srl', email: 'vendite@caviconnettori.it', telefono: '+39 02 6655447', citta: 'Monza', provincia: 'MB', indirizzo: 'Via Borgazzi 120', piva: 'IT12233445566', cf: '12233445566', pec: 'caviconn@pec.it', sdi: 'CVC2345', note: 'Fornitore secondario, attivato solo su rottura di stock.', stato: 'inattivo', categoria: 'Networking', pagamento: '0', leadTime: 2, iban: 'IT31A0503401633000000123456', acquistato: 6400, ordini: 8, debito: 0 },
    { id: 12, nome: 'Ottica Industriale Rossi', email: 'info@otticaindustriale.it', telefono: '+39 045 7788112', citta: 'Verona', provincia: 'VR', indirizzo: 'Via Torbido 33', piva: 'IT13344556677', cf: '13344556677', pec: 'otticaind@pec.it', sdi: 'OIR6789', note: '', stato: 'inattivo', categoria: 'Illuminazione', pagamento: '60', leadTime: 18, iban: 'IT66B0200811730000103456781', acquistato: 9300, ordini: 6, debito: 0 },
];

const store = collection('fornitori', SEED);
let nextId = nextIdOf(store);

const LATENCY = 120;
const delay = () => new Promise((r) => setTimeout(r, LATENCY));

export async function fetchFornitori(): Promise<Fornitore[]> {
    await delay();
    return store.slice();
}

export async function createFornitore(data: FornitoreFormValues): Promise<Fornitore> {
    await delay();
    const fornitore: Fornitore = { ...data, id: nextId++, acquistato: 0, ordini: 0, debito: 0 };
    store.push(fornitore);
    return fornitore;
}

export async function updateFornitore(id: number, data: FornitoreFormValues): Promise<Fornitore> {
    await delay();
    const idx = store.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error('Fornitore non trovato');
    store[idx] = { ...store[idx]!, ...data };
    return store[idx]!;
}

export async function deleteFornitore(id: number): Promise<void> {
    await delay();
    const idx = store.findIndex((f) => f.id === id);
    if (idx !== -1) store.splice(idx, 1);
}

/** Ragioni sociali per la <select> Fornitore del modale prodotto in Inventario. */
export async function fetchFornitoriNomi(): Promise<string[]> {
    await delay();
    return store.filter((f) => f.stato === 'attivo').map((f) => f.nome);
}
