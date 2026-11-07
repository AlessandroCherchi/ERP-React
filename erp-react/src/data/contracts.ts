// Contratti del data layer: ciò che le pagine possono chiedere ai dati.
// Oggi li implementano i mock (lib/mockApi), domani il client HTTP su
// /api/v1 (spec §4). Le pagine dipendono da queste interfacce tramite gli
// hook di data/hooks.ts, mai dall'implementazione.

import type { Cliente, ClienteFormValues, ClienteRef } from '../types/cliente';
import type { Fornitore, FornitoreFormValues, FornitoreRef } from '../types/fornitore';
import type { Movimento, Prodotto } from '../types/prodotto';
import type { ProdottoForm } from '../types/quickActions';
import type { Ordine, OrdineFormValues, OrdineStato } from '../types/ordine';
import type { Utente, UtenteFormValues } from '../types/utente';
import type { AcquistoFormValues, OrdineAcquisto } from '../types/acquisto';
import type { RicevimentoInput } from '../lib/mockApi/acquisti';
import type { RettificaInput } from '../lib/mockApi/inventario';

export type { ClienteRef, RettificaInput, RicevimentoInput };

export interface ClientiApi {
    list(): Promise<Cliente[]>;
    listSelezionabili(): Promise<ClienteRef[]>;
    create(data: ClienteFormValues): Promise<Cliente>;
    update(id: number, data: ClienteFormValues): Promise<Cliente>;
    remove(id: number): Promise<void>;
}

export interface FornitoriApi {
    list(): Promise<Fornitore[]>;
    listRef(): Promise<FornitoreRef[]>;
    create(data: FornitoreFormValues): Promise<Fornitore>;
    update(id: number, data: FornitoreFormValues): Promise<Fornitore>;
    remove(id: number): Promise<void>;
}

export interface MagazzinoApi {
    listProdotti(): Promise<Prodotto[]>;
    listMovimenti(): Promise<Movimento[]>;
    createProdotto(data: ProdottoForm): Promise<Prodotto>;
    updateProdotto(id: number, data: ProdottoForm): Promise<Prodotto>;
    removeProdotto(id: number): Promise<void>;
    registraMovimento(input: RettificaInput): Promise<Prodotto>;
}

export interface OrdiniApi {
    list(): Promise<Ordine[]>;
    create(data: OrdineFormValues): Promise<Ordine>;
    update(id: number, data: OrdineFormValues): Promise<Ordine>;
    remove(id: number): Promise<void>;
    cambiaStato(id: number, nuovo: OrdineStato): Promise<Ordine>;
}

export interface UtentiApi {
    list(): Promise<Utente[]>;
    invite(data: UtenteFormValues): Promise<Utente>;
    update(id: string, patch: Partial<Pick<Utente, 'name' | 'role' | 'attivo'>>): Promise<Utente>;
}

export interface AcquistiApi {
    list(): Promise<OrdineAcquisto[]>;
    create(data: AcquistoFormValues): Promise<OrdineAcquisto>;
    createBatch(list: AcquistoFormValues[]): Promise<OrdineAcquisto[]>;
    update(id: number, data: AcquistoFormValues): Promise<OrdineAcquisto>;
    remove(id: number): Promise<void>;
    cambiaStato(id: number, nuovo: 'inviato' | 'annullato'): Promise<OrdineAcquisto>;
    ricevi(input: RicevimentoInput): Promise<OrdineAcquisto>;
}

export interface DataApi {
    clienti: ClientiApi;
    fornitori: FornitoriApi;
    magazzino: MagazzinoApi;
    ordini: OrdiniApi;
    utenti: UtentiApi;
    acquisti: AcquistiApi;
}
