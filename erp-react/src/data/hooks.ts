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
export const useFornitoriNomi = () => useQuery({ queryKey: qk.fornitori.nomi, queryFn: api.fornitori.listNomiAttivi });

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
