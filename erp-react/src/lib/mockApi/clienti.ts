// Mock "server state" — stesso identico dataset demo di clienti.js.
// TODO(step Backend, spec §4/§5): sostituire con client HTTP reale su
// /api/v1/clienti, stesso envelope ApiResponse, stessa firma delle
// funzioni così TanStack Query non cambia in Dashboard/Clienti.

import type { Cliente, ClienteFormValues } from '../../types/cliente';
import { collection, nextIdOf } from './db';

const SEED: Cliente[] = [
    { id: 1, nome: 'Rossi S.r.l.', email: 'info@rossi-srl.it', telefono: '+39 02 4567890', citta: 'Milano', provincia: 'MI', indirizzo: 'Via Montenapoleone 12', piva: 'IT01234567890', cf: '01234567890', pec: 'rossi@pec.it', sdi: 'ABC1234', stato: 'attivo', fatturato: 45200, ordini: 32, credito: 3200, note: 'Cliente premium con condizioni speciali di pagamento a 60gg.' },
    { id: 2, nome: 'Bianchi & Co.', email: 'admin@bianchico.it', telefono: '+39 06 7891234', citta: 'Roma', provincia: 'RM', indirizzo: 'Via del Corso 88', piva: 'IT09876543210', cf: '09876543210', pec: 'bianchi@pec.it', sdi: 'XYZ7890', stato: 'attivo', fatturato: 32100, ordini: 21, credito: 1500, note: '' },
    { id: 3, nome: 'Verdi Elettronica', email: 'contatti@verdi-el.it', telefono: '+39 011 2345678', citta: 'Torino', provincia: 'TO', indirizzo: 'Corso Francia 45', piva: 'IT11223344556', cf: 'VRDLRC80A01L219X', pec: 'verdi@pec.it', sdi: 'DEF4567', stato: 'attivo', fatturato: 28500, ordini: 18, credito: 0, note: 'Fornitore e cliente — relazione bidirezionale.' },
    { id: 4, nome: 'Gialli Impianti', email: 'gialli@gmail.com', telefono: '+39 055 6789012', citta: 'Firenze', provincia: 'FI', indirizzo: 'Viale Europa 22', piva: 'IT55667788990', cf: '55667788990', pec: '', sdi: '', stato: 'inattivo', fatturato: 8900, ordini: 6, credito: 4200, note: 'Ultimo ordine 6 mesi fa. Follow-up necessario.' },
    { id: 5, nome: 'Neri Logistica', email: 'info@nerilog.it', telefono: '+39 081 3456789', citta: 'Napoli', provincia: 'NA', indirizzo: 'Via Marina 156', piva: 'IT99887766554', cf: '99887766554', pec: 'neri@legalmail.it', sdi: 'GHI1234', stato: 'attivo', fatturato: 52300, ordini: 45, credito: 2100, note: 'Partner strategico area Sud.' },
    { id: 6, nome: 'Blu Tech Solutions', email: 'sales@blutech.it', telefono: '+39 051 8901234', citta: 'Bologna', provincia: 'BO', indirizzo: 'Via Rizzoli 33', piva: 'IT33445566778', cf: '33445566778', pec: 'blutech@pec.it', sdi: 'JKL5678', stato: 'attivo', fatturato: 19800, ordini: 14, credito: 800, note: '' },
    { id: 7, nome: 'Arancio Design', email: 'hello@aranciodesign.it', telefono: '+39 041 5678901', citta: 'Venezia', provincia: 'VE', indirizzo: 'Fondamenta Nuove 5', piva: 'IT66778899001', cf: 'RNCGPP85E15L736Z', pec: '', sdi: '', stato: 'prospect', fatturato: 0, ordini: 0, credito: 0, note: 'Contattato alla fiera di settore. Molto interessato alla linea Pro.' },
    { id: 8, nome: 'Viola Consulting', email: 'info@violaconsulting.it', telefono: '+39 010 1234567', citta: 'Genova', provincia: 'GE', indirizzo: 'Via XX Settembre 90', piva: 'IT22334455667', cf: '22334455667', pec: 'viola@pec.it', sdi: 'MNO9012', stato: 'attivo', fatturato: 15600, ordini: 11, credito: 500, note: '' },
    { id: 9, nome: 'Grigio Metalli', email: 'ordini@grigiometalli.it', telefono: '+39 035 9012345', citta: 'Bergamo', provincia: 'BG', indirizzo: 'Via Borgo Palazzo 120', piva: 'IT44556677889', cf: '44556677889', pec: 'grigio@pec.it', sdi: 'PQR3456', stato: 'attivo', fatturato: 41700, ordini: 29, credito: 6800, note: 'Pagamento lento — monitorare scadenze.' },
    { id: 10, nome: 'Celeste Pharma', email: 'info@celestepharma.it', telefono: '+39 049 2345678', citta: 'Padova', provincia: 'PD', indirizzo: 'Via Euganea 78', piva: 'IT77889900112', cf: '77889900112', pec: 'celeste@pec.it', sdi: 'STU6789', stato: 'attivo', fatturato: 67200, ordini: 38, credito: 1200, note: 'Settore regolamentato — documentazione speciale richiesta.' },
    { id: 11, nome: 'Marrone Edilizia', email: 'info@marroneedil.it', telefono: '+39 091 4567890', citta: 'Palermo', provincia: 'PA', indirizzo: 'Via Libertà 200', piva: 'IT11002233445', cf: '11002233445', pec: '', sdi: '', stato: 'inattivo', fatturato: 5400, ordini: 4, credito: 2900, note: '' },
    { id: 12, nome: 'Turchese Digital', email: 'ciao@turchesedigital.it', telefono: '+39 070 5678901', citta: 'Cagliari', provincia: 'CA', indirizzo: 'Via Roma 15', piva: 'IT88990011223', cf: 'TRCMRK90B20B354W', pec: 'turchese@pec.it', sdi: 'VWX0123', stato: 'prospect', fatturato: 0, ordini: 0, credito: 0, note: 'Startup innovativa. Potenziale alto.' },
    { id: 13, nome: 'Corallo Alimentari', email: 'ordini@coralloalim.it', telefono: '+39 080 6789012', citta: 'Bari', provincia: 'BA', indirizzo: 'Via Sparano 65', piva: 'IT55443322110', cf: '55443322110', pec: 'corallo@pec.it', sdi: 'YZA3456', stato: 'attivo', fatturato: 23400, ordini: 16, credito: 900, note: '' },
    { id: 14, nome: 'Ocra Meccanica', email: 'info@ocrameccanica.it', telefono: '+39 030 7890123', citta: 'Brescia', provincia: 'BS', indirizzo: 'Via Orzinuovi 44', piva: 'IT66554433221', cf: '66554433221', pec: 'ocra@pec.it', sdi: 'BCD5678', stato: 'attivo', fatturato: 38900, ordini: 27, credito: 3100, note: 'Lavorazioni speciali con lead time di 15gg.' },
    { id: 15, nome: 'Ambra Tessuti', email: 'vendite@ambratessuti.it', telefono: '+39 0574 890123', citta: 'Prato', provincia: 'PO', indirizzo: 'Via Galcianese 110', piva: 'IT99001122334', cf: '99001122334', pec: 'ambra@pec.it', sdi: 'EFG7890', stato: 'attivo', fatturato: 29100, ordini: 20, credito: 1600, note: '' },
    { id: 16, nome: 'Indaco Software', email: 'hello@indacosoft.it', telefono: '+39 02 9012345', citta: 'Milano', provincia: 'MI', indirizzo: 'Via Tortona 27', piva: 'IT00112233445', cf: '00112233445', pec: 'indaco@pec.it', sdi: 'HIJ0123', stato: 'attivo', fatturato: 14300, ordini: 9, credito: 0, note: '' },
    { id: 17, nome: 'Smeraldo Energia', email: 'info@smeraldoenergia.it', telefono: '+39 06 0123456', citta: 'Roma', provincia: 'RM', indirizzo: 'Via Cristoforo Colombo 350', piva: 'IT33221100998', cf: '33221100998', pec: 'smeraldo@pec.it', sdi: 'KLM3456', stato: 'attivo', fatturato: 56700, ordini: 34, credito: 4500, note: 'Contratto quadro annuale da rinnovare a Dicembre.' },
    { id: 18, nome: 'Rame Costruzioni', email: 'info@ramecostruzioni.it', telefono: '+39 095 1234567', citta: 'Catania', provincia: 'CT', indirizzo: 'Viale Africa 88', piva: 'IT44332211009', cf: '44332211009', pec: '', sdi: '', stato: 'inattivo', fatturato: 3200, ordini: 2, credito: 1800, note: 'In ristrutturazione aziendale.' },
    { id: 19, nome: 'Platino Medical', email: 'ordini@platinomedical.it', telefono: '+39 045 2345678', citta: 'Verona', provincia: 'VR', indirizzo: 'Via Adigetto 17', piva: 'IT88776655443', cf: '88776655443', pec: 'platino@pec.it', sdi: 'NOP6789', stato: 'attivo', fatturato: 42800, ordini: 31, credito: 2200, note: '' },
    { id: 20, nome: 'Bronzo Trasporti', email: 'info@bronzotrasporti.it', telefono: '+39 011 3456789', citta: 'Torino', provincia: 'TO', indirizzo: 'Strada del Drosso 33', piva: 'IT11998877665', cf: '11998877665', pec: 'bronzo@pec.it', sdi: 'QRS8901', stato: 'attivo', fatturato: 31500, ordini: 22, credito: 1100, note: '' },
    { id: 21, nome: 'Avorio Interior', email: 'studio@avoriointerior.it', telefono: '+39 02 4567891', citta: 'Milano', provincia: 'MI', indirizzo: 'Via Brera 6', piva: 'IT22110099887', cf: 'VRMRCO88C12F205Y', pec: 'avorio@pec.it', sdi: 'TUV1234', stato: 'prospect', fatturato: 0, ordini: 0, credito: 0, note: 'Incontro fissato per il 25 del mese.' },
    { id: 22, nome: 'Titanio Aerospace', email: 'procurement@titanioaero.it', telefono: '+39 050 5678902', citta: 'Pisa', provincia: 'PI', indirizzo: 'Via Livornese 120', piva: 'IT55001122334', cf: '55001122334', pec: 'titanio@pec.it', sdi: 'WXY4567', stato: 'attivo', fatturato: 89400, ordini: 52, credito: 5600, note: 'Certificazioni AS9100 richieste per ogni fornitura.' },
    { id: 23, nome: 'Lilla Cosmetics', email: 'ordini@lillacosmetics.it', telefono: '+39 081 6789013', citta: 'Napoli', provincia: 'NA', indirizzo: 'Via Chiaia 200', piva: 'IT66001122335', cf: '66001122335', pec: 'lilla@pec.it', sdi: 'ZAB5678', stato: 'attivo', fatturato: 17600, ordini: 13, credito: 400, note: '' },
    { id: 24, nome: 'Cobalto Security', email: 'info@cobaltosecurity.it', telefono: '+39 06 7890124', citta: 'Roma', provincia: 'RM', indirizzo: 'Via Tuscolana 520', piva: 'IT77001122336', cf: '77001122336', pec: 'cobalto@pec.it', sdi: 'CDE6789', stato: 'attivo', fatturato: 26300, ordini: 19, credito: 1800, note: '' },
];

const store = collection('clienti', SEED);
let nextId = nextIdOf(store);

const LATENCY = 120;
const delay = () => new Promise((r) => setTimeout(r, LATENCY));

export async function fetchClienti(): Promise<Cliente[]> {
    await delay();
    return store.slice();
}

export async function createCliente(data: ClienteFormValues): Promise<Cliente> {
    await delay();
    const cliente: Cliente = { ...data, id: nextId++, fatturato: 0, ordini: 0, credito: 0 };
    store.push(cliente);
    return cliente;
}

export async function updateCliente(id: number, data: ClienteFormValues): Promise<Cliente> {
    await delay();
    const idx = store.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Cliente non trovato');
    store[idx] = { ...store[idx]!, ...data };
    return store[idx]!;
}

export async function deleteCliente(id: number): Promise<void> {
    await delay();
    const idx = store.findIndex((c) => c.id === id);
    if (idx !== -1) store.splice(idx, 1);
}

/** Nomi clienti per le <select> dei modali dashboard (Ordine/Fattura). */
export async function fetchClientiNomi(): Promise<string[]> {
    await delay();
    return store.map((c) => c.nome);
}

/** Riferimento minimo a un cliente, per le <select> dei documenti. */
export interface ClienteRef {
    id: number;
    nome: string;
}

/**
 * Clienti selezionabili in un nuovo documento: tutti tranne gli inattivi.
 * I prospect restano in elenco — il primo ordine è esattamente il momento
 * in cui un prospect smette di esserlo.
 */
export async function fetchClientiSelezionabili(): Promise<ClienteRef[]> {
    await delay();
    return store.filter((c) => c.stato !== 'inattivo').map((c) => ({ id: c.id, nome: c.nome }));
}

/**
 * Ragione sociale di un cliente, per lo snapshot salvato nei documenti.
 * Sincrona: la risoluzione dell'anagrafica in un documento è un'operazione
 * che il backend farà dentro la stessa transazione della creazione, non
 * una seconda chiamata di rete.
 */
export function nomeCliente(id: number): string {
    return store.find((c) => c.id === id)?.nome ?? '';
}
