// TanStack Query v5 — Implementation Contract v3.1 §3: server state,
// cache/query/realtime. Nessuna autorità fiscale qui: solo cache.

import { MutationCache, QueryClient } from '@tanstack/react-query';
import { saveAll } from './mockApi/db';

export const queryClient = new QueryClient({
    // Persistenza dei mock dopo ogni mutation (riuscita o no: un errore di
    // dominio non scrive nulla, ma salvare comunque è innocuo e più semplice
    // da garantire). TODO(step Backend): rimuovere insieme ai mock.
    mutationCache: new MutationCache({ onSettled: () => saveAll() }),
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 30_000,
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 0,
        },
    },
});
