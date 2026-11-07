// Hook del data layer: unico punto in cui le pagine incontrano i dati.
// Ogni mutation conosce le query che rende stale e le invalida da sé:
// la pagina si occupa solo del feedback (toast) tramite options.onSuccess.

import {
    useMutation, useQuery, useQueryClient,
    type QueryKey, type UseMutationOptions,
} from '@tanstack/react-query';
import { api } from './api';
import { qk } from './queryKeys';
import type { ClienteFormValues } from '../types/cliente';
import type { FornitoreFormValues } from '../types/fornitore';
import type { ProdottoForm } from '../types/quickActions';
import type { OrdineFormValues, OrdineStato } from '../types/ordine';
import type { RettificaInput } from './contracts';
import type { Utente, UtenteFormValues } from '../types/utente';
import type { AcquistoFormValues, OrdineAcquisto } from '../types/acquisto';
import type { IncassoInput, RicevimentoInput } from './contracts';
import type { Fattura, FatturaFormValues, Incasso } from '../types/fattura';

/** Opzioni che una pagina può passare: callback di feedback, non invalidazioni. */
type MutationHookOptions<TData, TVars> = Pick<
    UseMutationOptions<TData, Error, TVars>,
    'onSuccess' | 'onError' | 'onSettled'
>;

function useEntityMutation<TData, TVars>(
    mutationFn: (vars: TVars) => Promise<TData>,
    invalidates: QueryKey[],
    options?: MutationHookOptions<TData, TVars>
) {
    const queryClient = useQueryClient();
    return useMutation<TData, Error, TVars>({
        mutationFn,
        onSuccess: (...args) => {
            for (const key of invalidates) queryClient.invalidateQueries({ queryKey: key });
            return options?.onSuccess?.(...args);
        },
        onError: options?.onError,
        onSettled: options?.onSettled,
    });
}

const MAGAZZINO = [qk.prodotti.all, qk.movimenti.all];

// ------------------------- CLIENTI -------------------------

export const useClienti = () => useQuery({ queryKey: qk.clienti.all, queryFn: api.clienti.list });
export const useClientiSelezionabili = () => useQuery({ queryKey: qk.clienti.ref, queryFn: api.clienti.listSelezionabili });

export const useCreateCliente = (o?: MutationHookOptions<Awaited<ReturnType<typeof api.clienti.create>>, ClienteFormValues>) =>
    useEntityMutation(api.clienti.create, [qk.clienti.all], o);
export const useUpdateCliente = (o?: MutationHookOptions<Awaited<ReturnType<typeof api.clienti.update>>, { id: number; data: ClienteFormValues }>) =>
    useEntityMutation(({ id, data }) => api.clienti.update(id, data), [qk.clienti.all], o);
export const useDeleteCliente = (o?: MutationHookOptions<void, number>) =>
    useEntityMutation(api.clienti.remove, [qk.clienti.all], o);

// ------------------------- FORNITORI -------------------------

export const useFornitori = () => useQuery({ queryKey: qk.fornitori.all, queryFn: api.fornitori.list });
export const useFornitoriRef = () => useQuery({ queryKey: qk.fornitori.ref, queryFn: api.fornitori.listRef });

export const useCreateFornitore = (o?: MutationHookOptions<Awaited<ReturnType<typeof api.fornitori.create>>, FornitoreFormValues>) =>
    useEntityMutation(api.fornitori.create, [qk.fornitori.all], o);
export const useUpdateFornitore = (o?: MutationHookOptions<Awaited<ReturnType<typeof api.fornitori.update>>, { id: number; data: FornitoreFormValues }>) =>
    useEntityMutation(({ id, data }) => api.fornitori.update(id, data), [qk.fornitori.all], o);
export const useDeleteFornitore = (o?: MutationHookOptions<void, number>) =>
    useEntityMutation(api.fornitori.remove, [qk.fornitori.all], o);

// ------------------------- MAGAZZINO -------------------------

export const useProdotti = () => useQuery({ queryKey: qk.prodotti.all, queryFn: api.magazzino.listProdotti });
export const useMovimenti = () => useQuery({ queryKey: qk.movimenti.all, queryFn: api.magazzino.listMovimenti });

export const useCreateProdotto = (o?: MutationHookOptions<Awaited<ReturnType<typeof api.magazzino.createProdotto>>, ProdottoForm>) =>
    useEntityMutation(api.magazzino.createProdotto, MAGAZZINO, o);
export const useUpdateProdotto = (o?: MutationHookOptions<Awaited<ReturnType<typeof api.magazzino.updateProdotto>>, { id: number; data: ProdottoForm }>) =>
    useEntityMutation(({ id, data }) => api.magazzino.updateProdotto(id, data), MAGAZZINO, o);
export const useDeleteProdotto = (o?: MutationHookOptions<void, number>) =>
    useEntityMutation(api.magazzino.removeProdotto, MAGAZZINO, o);
export const useRegistraMovimento = (o?: MutationHookOptions<Awaited<ReturnType<typeof api.magazzino.registraMovimento>>, RettificaInput>) =>
    useEntityMutation(api.magazzino.registraMovimento, MAGAZZINO, o);

// ------------------------- ORDINI -------------------------

export const useOrdini = () => useQuery({ queryKey: qk.ordini.all, queryFn: api.ordini.list });

export const useCreateOrdine = (o?: MutationHookOptions<Awaited<ReturnType<typeof api.ordini.create>>, OrdineFormValues>) =>
    useEntityMutation(api.ordini.create, [qk.ordini.all], o);
export const useUpdateOrdine = (o?: MutationHookOptions<Awaited<ReturnType<typeof api.ordini.update>>, { id: number; data: OrdineFormValues }>) =>
    useEntityMutation(({ id, data }) => api.ordini.update(id, data), [qk.ordini.all], o);
export const useDeleteOrdine = (o?: MutationHookOptions<void, number>) =>
    useEntityMutation(api.ordini.remove, [qk.ordini.all], o);
/** Una transizione può muovere il magazzino: invalida anche giacenze e movimenti. */
export const useCambiaStatoOrdine = (o?: MutationHookOptions<Awaited<ReturnType<typeof api.ordini.cambiaStato>>, { id: number; nuovo: OrdineStato }>) =>
    useEntityMutation(({ id, nuovo }) => api.ordini.cambiaStato(id, nuovo), [qk.ordini.all, ...MAGAZZINO], o);

// ------------------------- UTENTI -------------------------

export const useUtenti = () => useQuery({ queryKey: qk.utenti.all, queryFn: api.utenti.list });
export const useInvitaUtente = (o?: MutationHookOptions<Utente, UtenteFormValues>) =>
    useEntityMutation(api.utenti.invite, [qk.utenti.all], o);
export const useAggiornaUtente = (o?: MutationHookOptions<Utente, { id: string; patch: Partial<Pick<Utente, 'name' | 'role' | 'attivo'>> }>) =>
    useEntityMutation(({ id, patch }) => api.utenti.update(id, patch), [qk.utenti.all], o);

// ------------------------- ACQUISTI -------------------------

export const useAcquisti = () => useQuery({ queryKey: qk.acquisti.all, queryFn: api.acquisti.list });
export const useCreateAcquisto = (o?: MutationHookOptions<OrdineAcquisto, AcquistoFormValues>) =>
    useEntityMutation(api.acquisti.create, [qk.acquisti.all], o);
export const useCreateAcquistiBatch = (o?: MutationHookOptions<OrdineAcquisto[], AcquistoFormValues[]>) =>
    useEntityMutation(api.acquisti.createBatch, [qk.acquisti.all], o);
export const useUpdateAcquisto = (o?: MutationHookOptions<OrdineAcquisto, { id: number; data: AcquistoFormValues }>) =>
    useEntityMutation(({ id, data }) => api.acquisti.update(id, data), [qk.acquisti.all], o);
export const useDeleteAcquisto = (o?: MutationHookOptions<void, number>) =>
    useEntityMutation(api.acquisti.remove, [qk.acquisti.all], o);
export const useCambiaStatoAcquisto = (o?: MutationHookOptions<OrdineAcquisto, { id: number; nuovo: 'inviato' | 'annullato' }>) =>
    useEntityMutation(({ id, nuovo }) => api.acquisti.cambiaStato(id, nuovo), [qk.acquisti.all], o);
/** Il ricevimento carica il magazzino e ricalcola il costo medio: invalida anche giacenze e movimenti. */
export const useRiceviAcquisto = (o?: MutationHookOptions<OrdineAcquisto, RicevimentoInput>) =>
    useEntityMutation(api.acquisti.ricevi, [qk.acquisti.all, ...MAGAZZINO], o);

// ------------------------- FATTURE E INCASSI -------------------------

const FATTURE = [qk.fatture.all];
const CREDITI = [qk.fatture.all, qk.incassi.all];

export const useFatture = () => useQuery({ queryKey: qk.fatture.all, queryFn: api.fatture.list });
export const useIncassi = () => useQuery({ queryKey: qk.incassi.all, queryFn: api.fatture.listIncassi });
export const useCreateFattura = (o?: MutationHookOptions<Fattura, FatturaFormValues>) => useEntityMutation(api.fatture.create, FATTURE, o);
export const useUpdateFattura = (o?: MutationHookOptions<Fattura, { id: number; data: FatturaFormValues }>) =>
    useEntityMutation(({ id, data }) => api.fatture.update(id, data), FATTURE, o);
export const useDeleteFattura = (o?: MutationHookOptions<void, number>) => useEntityMutation(api.fatture.remove, FATTURE, o);
export const useEmettiFattura = (o?: MutationHookOptions<Fattura, number>) => useEntityMutation(api.fatture.emetti, FATTURE, o);
export const useInviaSdi = (o?: MutationHookOptions<Fattura, number>) => useEntityMutation(api.fatture.inviaSdi, FATTURE, o);
export const useRegistraIncasso = (o?: MutationHookOptions<Incasso, IncassoInput>) => useEntityMutation(api.fatture.registraIncasso, CREDITI, o);
export const useEliminaIncasso = (o?: MutationHookOptions<void, number>) => useEntityMutation(api.fatture.eliminaIncasso, CREDITI, o);
