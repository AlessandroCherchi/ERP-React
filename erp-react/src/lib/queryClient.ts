// TanStack Query v5 — Implementation Contract v3.1 §3: server state,
// cache/query/realtime. Nessuna autorità fiscale qui: solo cache.

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
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
