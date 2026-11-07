// Hook del data layer: unico punto in cui le pagine incontrano i dati.
// Ogni mutation dichiara (1) le query che rende stale e (2) cosa scrivere
// nel registro attività; la pagina si occupa solo del feedback (toast)
// tramite options.onSuccess/onError.

import {
    useMutation, useQuery, useQueryClient,
    type QueryKey, type UseMutationOptions,
} from '@tanstack/react-query';
import { api } from './api';
import { qk } from './queryKeys';
import type { IncassoInput, RettificaInput, RicevimentoInput } from './contracts';
import type { AuditDescriptor } from '../types/audit';
import type { ClienteFormValues } from '../types/cliente';
import type { FornitoreFormValues } from '../types/fornitore';
import type { ProdottoForm } from '../types/prodotto';
import { STATO_ORDINE_LABEL, type OrdineFormValues, type OrdineStato } from '../types/ordine';
import type { Utente, UtenteFormValues } from '../types/utente';
import type { AcquistoFormValues, OrdineAcquisto } from '../types/acquisto';
import { TIPO_DOCUMENTO_LABEL, type Fattura, type FatturaFormValues, type Incasso } from '../types/fattura';

/** Opzioni che una pagina può passare: callback di feedback, non invalidazioni. */
type MutationHookOptions<TData, TVars> = Pick<
    UseMutationOptions<TData, Error, TVars>,
    'onSuccess' | 'onError' | 'onSettled'
>;

/**
 * Mutation di entità: invalida le query indicate e, se dichiarato, scrive
 * nel registro attività (il MutationCache legge `meta.audit`, vedi
 * lib/queryClient.ts).
 */
function useEntityMutation<TData, TVars>(
    mutationFn: (vars: TVars) => Promise<TData>,
    invalidates: QueryKey[],
    options?: MutationHookOptions<TData, TVars>,
    audit?: AuditDescriptor<TData, TVars>
) {
    const queryClient = useQueryClient();
    return useMutation<TData, Error, TVars>({
        mutationFn,
        meta: audit ? { audit } : undefined,
        onSuccess: (...args) => {
            for (const key of invalidates) queryClient.invalidateQueries({ queryKey: key });
            return options?.onSuccess?.(...args);
        },
        onError: options?.onError,
        onSettled: options?.onSettled,
    });
}

const MAGAZZINO = [qk.prodotti.all, qk.movimenti.all];
type Opts<TData, TVars> = MutationHookOptions<TData, TVars>;
type Data<F extends (...a: never[]) => Promise<unknown>> = Awaited<ReturnType<F>>;

// ------------------------- CLIENTI -------------------------

export const useClienti = () => useQuery({ queryKey: qk.clienti.all, queryFn: api.clienti.list });
export const useClientiSelezionabili = () => useQuery({ queryKey: qk.clienti.ref, queryFn: api.clienti.listSelezionabili });

export const useCreateCliente = (o?: Opts<Data<typeof api.clienti.create>, ClienteFormValues>) =>
    useEntityMutation(api.clienti.create, [qk.clienti.all], o, (c) => ({ icon: 'fa-user-plus', text: `Nuovo cliente ${c.nome}`, modulo: 'clienti' }));
export const useUpdateCliente = (o?: Opts<Data<typeof api.clienti.update>, { id: number; data: ClienteFormValues }>) =>
    useEntityMutation(({ id, data }) => api.clienti.update(id, data), [qk.clienti.all], o, (c) => ({ icon: 'fa-user-pen', text: `Cliente ${c.nome} aggiornato`, modulo: 'clienti' }));
export const useDeleteCliente = (o?: Opts<void, number>) =>
    useEntityMutation(api.clienti.remove, [qk.clienti.all], o, (_d, id) => ({ icon: 'fa-user-minus', text: `Cliente #${id} eliminato`, modulo: 'clienti' }));

// ------------------------- FORNITORI -------------------------

export const useFornitori = () => useQuery({ queryKey: qk.fornitori.all, queryFn: api.fornitori.list });
export const useFornitoriRef = () => useQuery({ queryKey: qk.fornitori.ref, queryFn: api.fornitori.listRef });

export const useCreateFornitore = (o?: Opts<Data<typeof api.fornitori.create>, FornitoreFormValues>) =>
    useEntityMutation(api.fornitori.create, [qk.fornitori.all], o, (f) => ({ icon: 'fa-truck-field', text: `Nuovo fornitore ${f.nome}`, modulo: 'fornitori' }));
export const useUpdateFornitore = (o?: Opts<Data<typeof api.fornitori.update>, { id: number; data: FornitoreFormValues }>) =>
    useEntityMutation(({ id, data }) => api.fornitori.update(id, data), [qk.fornitori.all], o, (f) => ({ icon: 'fa-pen', text: `Fornitore ${f.nome} aggiornato`, modulo: 'fornitori' }));
export const useDeleteFornitore = (o?: Opts<void, number>) =>
    useEntityMutation(api.fornitori.remove, [qk.fornitori.all], o, (_d, id) => ({ icon: 'fa-trash-can', text: `Fornitore #${id} eliminato`, modulo: 'fornitori' }));

// ------------------------- MAGAZZINO -------------------------

export const useProdotti = () => useQuery({ queryKey: qk.prodotti.all, queryFn: api.magazzino.listProdotti });
export const useMovimenti = () => useQuery({ queryKey: qk.movimenti.all, queryFn: api.magazzino.listMovimenti });

export const useCreateProdotto = (o?: Opts<Data<typeof api.magazzino.createProdotto>, ProdottoForm>) =>
    useEntityMutation(api.magazzino.createProdotto, MAGAZZINO, o, (p) => ({ icon: 'fa-box', text: `Nuovo articolo ${p.nome} (${p.sku})`, modulo: 'inventario' }));
export const useUpdateProdotto = (o?: Opts<Data<typeof api.magazzino.updateProdotto>, { id: number; data: ProdottoForm }>) =>
    useEntityMutation(({ id, data }) => api.magazzino.updateProdotto(id, data), MAGAZZINO, o, (p) => ({ icon: 'fa-pen', text: `Articolo ${p.sku} aggiornato`, modulo: 'inventario' }));
export const useDeleteProdotto = (o?: Opts<void, number>) =>
    useEntityMutation(api.magazzino.removeProdotto, MAGAZZINO, o, (_d, id) => ({ icon: 'fa-trash-can', text: `Articolo #${id} eliminato`, modulo: 'inventario' }));
export const useRegistraMovimento = (o?: Opts<Data<typeof api.magazzino.registraMovimento>, RettificaInput>) =>
    useEntityMutation(api.magazzino.registraMovimento, MAGAZZINO, o, (p, v) => ({ icon: 'fa-right-left', text: `${v.tipo === 'carico' ? 'Carico' : v.tipo === 'scarico' ? 'Scarico' : 'Rettifica'} ${p.sku}: ${v.quantita} ${p.unita}`, modulo: 'inventario' }));

// ------------------------- ORDINI DI VENDITA -------------------------

export const useOrdini = () => useQuery({ queryKey: qk.ordini.all, queryFn: api.ordini.list });

export const useCreateOrdine = (o?: Opts<Data<typeof api.ordini.create>, OrdineFormValues>) =>
    useEntityMutation(api.ordini.create, [qk.ordini.all], o, (x) => ({ icon: 'fa-cart-shopping', text: `Nuovo ordine ${x.numero} — ${x.cliente}`, modulo: 'vendite' }));
export const useUpdateOrdine = (o?: Opts<Data<typeof api.ordini.update>, { id: number; data: OrdineFormValues }>) =>
    useEntityMutation(({ id, data }) => api.ordini.update(id, data), [qk.ordini.all], o, (x) => ({ icon: 'fa-pen', text: `Ordine ${x.numero} aggiornato`, modulo: 'vendite' }));
export const useDeleteOrdine = (o?: Opts<void, number>) =>
    useEntityMutation(api.ordini.remove, [qk.ordini.all], o, (_d, id) => ({ icon: 'fa-trash-can', text: `Ordine #${id} eliminato`, modulo: 'vendite' }));
/** Una transizione può muovere il magazzino: invalida anche giacenze e movimenti. */
export const useCambiaStatoOrdine = (o?: Opts<Data<typeof api.ordini.cambiaStato>, { id: number; nuovo: OrdineStato }>) =>
    useEntityMutation(({ id, nuovo }) => api.ordini.cambiaStato(id, nuovo), [qk.ordini.all, ...MAGAZZINO], o,
        (x) => ({ icon: 'fa-arrows-rotate', text: `Ordine ${x.numero}: ${STATO_ORDINE_LABEL[x.stato].toLowerCase()}`, modulo: 'vendite' }));

// ------------------------- UTENTI -------------------------

export const useUtenti = () => useQuery({ queryKey: qk.utenti.all, queryFn: api.utenti.list });
export const useInvitaUtente = (o?: Opts<Utente, UtenteFormValues>) =>
    useEntityMutation(api.utenti.invite, [qk.utenti.all], o, (u) => ({ icon: 'fa-user-plus', text: `Utente ${u.name} invitato (${u.role})`, modulo: 'impostazioni' }));
export const useAggiornaUtente = (o?: Opts<Utente, { id: string; patch: Partial<Pick<Utente, 'name' | 'role' | 'attivo'>> }>) =>
    useEntityMutation(({ id, patch }) => api.utenti.update(id, patch), [qk.utenti.all], o,
        (u) => ({ icon: 'fa-user-gear', text: `Utente ${u.name} aggiornato${u.attivo ? '' : ' (disattivato)'}`, modulo: 'impostazioni' }));

// ------------------------- ACQUISTI -------------------------

export const useAcquisti = () => useQuery({ queryKey: qk.acquisti.all, queryFn: api.acquisti.list });
export const useCreateAcquisto = (o?: Opts<OrdineAcquisto, AcquistoFormValues>) =>
    useEntityMutation(api.acquisti.create, [qk.acquisti.all], o, (x) => ({ icon: 'fa-cart-flatbed', text: `Nuovo ordine d'acquisto ${x.numero} — ${x.fornitore}`, modulo: 'acquisti' }));
export const useCreateAcquistiBatch = (o?: Opts<OrdineAcquisto[], AcquistoFormValues[]>) =>
    useEntityMutation(api.acquisti.createBatch, [qk.acquisti.all], o, (l) => ({ icon: 'fa-wand-magic-sparkles', text: `Riordino: ${l.length} bozze create`, modulo: 'acquisti' }));
export const useUpdateAcquisto = (o?: Opts<OrdineAcquisto, { id: number; data: AcquistoFormValues }>) =>
    useEntityMutation(({ id, data }) => api.acquisti.update(id, data), [qk.acquisti.all], o, (x) => ({ icon: 'fa-pen', text: `Ordine d'acquisto ${x.numero} aggiornato`, modulo: 'acquisti' }));
export const useDeleteAcquisto = (o?: Opts<void, number>) =>
    useEntityMutation(api.acquisti.remove, [qk.acquisti.all], o, (_d, id) => ({ icon: 'fa-trash-can', text: `Ordine d'acquisto #${id} eliminato`, modulo: 'acquisti' }));
export const useCambiaStatoAcquisto = (o?: Opts<OrdineAcquisto, { id: number; nuovo: 'inviato' | 'annullato' }>) =>
    useEntityMutation(({ id, nuovo }) => api.acquisti.cambiaStato(id, nuovo), [qk.acquisti.all], o, (x) => ({ icon: 'fa-paper-plane', text: `Ordine d'acquisto ${x.numero}: ${x.stato}`, modulo: 'acquisti' }));
/** Il ricevimento carica il magazzino e ricalcola il costo medio: invalida anche giacenze e movimenti. */
export const useRiceviAcquisto = (o?: Opts<OrdineAcquisto, RicevimentoInput>) =>
    useEntityMutation(api.acquisti.ricevi, [qk.acquisti.all, ...MAGAZZINO], o, (x) => ({ icon: 'fa-dolly', text: `Merce ricevuta su ${x.numero} (${x.fornitore})`, modulo: 'acquisti' }));

// ------------------------- FATTURE E INCASSI -------------------------

const FATTURE = [qk.fatture.all];
const CREDITI = [qk.fatture.all, qk.incassi.all];
const label = (f: Fattura) => `${TIPO_DOCUMENTO_LABEL[f.tipo]} ${f.numero ?? '(bozza)'}`;

export const useFatture = () => useQuery({ queryKey: qk.fatture.all, queryFn: api.fatture.list });
export const useIncassi = () => useQuery({ queryKey: qk.incassi.all, queryFn: api.fatture.listIncassi });
export const useCreateFattura = (o?: Opts<Fattura, FatturaFormValues>) =>
    useEntityMutation(api.fatture.create, FATTURE, o, (f) => ({ icon: 'fa-file-circle-plus', text: `Bozza ${TIPO_DOCUMENTO_LABEL[f.tipo].toLowerCase()} — ${f.cliente.nome}`, modulo: 'fatture' }));
export const useUpdateFattura = (o?: Opts<Fattura, { id: number; data: FatturaFormValues }>) =>
    useEntityMutation(({ id, data }) => api.fatture.update(id, data), FATTURE, o, (f) => ({ icon: 'fa-pen', text: `${label(f)} aggiornata`, modulo: 'fatture' }));
export const useDeleteFattura = (o?: Opts<void, number>) =>
    useEntityMutation(api.fatture.remove, FATTURE, o, (_d, id) => ({ icon: 'fa-trash-can', text: `Bozza documento #${id} eliminata`, modulo: 'fatture' }));
export const useEmettiFattura = (o?: Opts<Fattura, number>) =>
    useEntityMutation(api.fatture.emetti, FATTURE, o, (f) => ({ icon: 'fa-stamp', text: `${label(f)} emessa — ${f.cliente.nome}`, modulo: 'fatture' }));
export const useInviaSdi = (o?: Opts<Fattura, number>) =>
    useEntityMutation(api.fatture.inviaSdi, FATTURE, o, (f) => ({ icon: 'fa-paper-plane', text: `${label(f)}: SDI ${f.sdi}`, modulo: 'fatture' }));
export const useRegistraIncasso = (o?: Opts<Incasso, IncassoInput>) =>
    useEntityMutation(api.fatture.registraIncasso, CREDITI, o, (i) => ({ icon: 'fa-coins', text: `Incasso € ${i.importo.toFixed(2)} su fattura #${i.fatturaId}`, modulo: 'contabilita' }));
export const useEliminaIncasso = (o?: Opts<void, number>) =>
    useEntityMutation(api.fatture.eliminaIncasso, CREDITI, o, (_d, id) => ({ icon: 'fa-trash-can', text: `Incasso #${id} eliminato`, modulo: 'contabilita' }));

// ------------------------- REGISTRO ATTIVITÀ -------------------------

export const useAudit = () => useQuery({ queryKey: qk.audit.all, queryFn: api.audit.list, staleTime: 0 });
