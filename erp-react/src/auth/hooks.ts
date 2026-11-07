import { useSession } from './session';
import { can, canTransition, type Action, type Resource, type Role } from './permissions';

/** Ruolo dell'utente corrente (null se non autenticato). */
export function useRole(): Role | null {
    return useSession()?.user.role ?? null;
}

/** `can(resource, action)` legato all'utente corrente. */
export function useCan(): (resource: Resource, action: Action) => boolean {
    const role = useRole();
    return (resource, action) => can(role, resource, action);
}

/** Permessi CRUD di una risorsa in un colpo solo — per le pagine elenco. */
export function usePermissions(resource: Resource) {
    const role = useRole();
    return {
        read: can(role, resource, 'read'),
        create: can(role, resource, 'create'),
        update: can(role, resource, 'update'),
        delete: can(role, resource, 'delete'),
        export: can(role, resource, 'export'),
        transition: (verso: string) => canTransition(role, verso),
    };
}
