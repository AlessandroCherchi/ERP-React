// TanStack Query v5 — Implementation Contract v3.1 §3: server state,
// cache/query/realtime. Nessuna autorità fiscale qui: solo cache.

import { MutationCache, QueryClient } from '@tanstack/react-query';
import { saveAll } from './mockApi/db';
import { recordAudit } from './mockApi/audit';
import { getSession } from '../auth/session';
import type { AuditDescriptor } from '../types/audit';

/**
 * Hook globali delle mutation:
 * - registro attività: le mutation che dichiarano `meta.audit` (data/hooks.ts)
 *   scrivono una voce con l'utente corrente. TODO(step Backend): l'audit lo
 *   scrive il server nella stessa transazione; qui resta solo l'invalidazione.
 * - persistenza dei mock dopo ogni mutation. TODO(step Backend): rimuovere.
 */
const mutationCache = new MutationCache({
    onSuccess: (data, variables, _ctx, mutation) => {
        const audit = mutation.meta?.audit as AuditDescriptor<unknown, unknown> | undefined;
        const user = getSession()?.user;
        if (!audit || !user) return;
        recordAudit({ ...audit(data, variables), at: new Date().toISOString(), userId: user.id, userName: user.name });
        void queryClient.invalidateQueries({ queryKey: ['audit'] });
    },
    onSettled: () => saveAll(),
});

export const queryClient = new QueryClient({
    mutationCache,
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
