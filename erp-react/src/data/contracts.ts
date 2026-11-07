// Contratti del data layer: ciò che le pagine possono chiedere ai dati.
// Oggi li implementano i mock (lib/mockApi), domani il client HTTP su
// /api/v1 (spec §4). Le pagine dipendono da queste interfacce tramite gli
// hook di data/hooks.ts, mai dall'implementazione.

import type { Cliente, ClienteFormValues, ClienteRef } from '../types/cliente';
import type { Fornitore, FornitoreFormValues, FornitoreRef } from '../types/fornitore';
import type { Movimento, Prodotto } from '../types/prodotto';
import type { ProdottoForm } from '../types/prodotto';
import type { Ordine, OrdineFormValues, OrdineStato } from '../types/ordine';
import type { Utente, UtenteFormValues } from '../types/utente';
import type { AcquistoFormValues, OrdineAcquisto } from '../types/acquisto';
import type { RicevimentoInput } from '../lib/mockApi/acquisti';
import type { Fattura, FatturaFormValues, Incasso } from '../types/fattura';
import type { IncassoInput } from '../lib/mockApi/fatture';
import type { AuditEntry } from '../types/audit';
import type { ContaInventario, Magazzino, MagazzinoFormValues } from '../types/magazzino';
import type { TrasferimentoInput } from '../lib/mockApi/inventario';
import type { AperturaContaInput } from '../lib/mockApi/conte';
import type { RettificaInput } from '../lib/mockApi/inventario';

export type { ClienteRef, RettificaInput, RicevimentoInput, IncassoInput, TrasferimentoInput, AperturaContaInput };

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
    trasferisci(input: TrasferimentoInput): Promise<Prodotto>;
    listMagazzini(): Promise<Magazzino[]>;
    createMagazzino(data: MagazzinoFormValues): Promise<Magazzino>;
    updateMagazzino(id: number, data: MagazzinoFormValues): Promise<Magazzino>;
    removeMagazzino(id: number, giacenzaResidua: number): Promise<void>;
    listConte(): Promise<ContaInventario[]>;
    apriConta(input: AperturaContaInput): Promise<ContaInventario>;
    salvaConteggi(id: number, contate: Array<number | null>): Promise<ContaInventario>;
    chiudiConta(id: number): Promise<{ conta: ContaInventario; rettifiche: number }>;
    annullaConta(id: number): Promise<ContaInventario>;
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

export interface FattureApi {
    list(): Promise<Fattura[]>;
    listIncassi(): Promise<Incasso[]>;
    create(data: FatturaFormValues): Promise<Fattura>;
    update(id: number, data: FatturaFormValues): Promise<Fattura>;
    remove(id: number): Promise<void>;
    /** Numerazione fiscale e immutabilità: operazione server. */
    emetti(id: number): Promise<Fattura>;
    inviaSdi(id: number): Promise<Fattura>;
    registraIncasso(input: IncassoInput): Promise<Incasso>;
    eliminaIncasso(id: number): Promise<void>;
}

export interface AuditApi {
    list(): Promise<AuditEntry[]>;
}

export interface DataApi {
    clienti: ClientiApi;
    fornitori: FornitoriApi;
    magazzino: MagazzinoApi;
    ordini: OrdiniApi;
    utenti: UtentiApi;
    acquisti: AcquistiApi;
    fatture: FattureApi;
    audit: AuditApi;
}
