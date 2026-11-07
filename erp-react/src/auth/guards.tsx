import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from './session';
import { can, type Action, type Resource } from './permissions';
import { useRole } from './hooks';

/** Rende i figli solo se l'utente ha il permesso. */
export function Can({ resource, action, children, fallback = null }: {
    resource: Resource;
    action: Action;
    children: ReactNode;
    fallback?: ReactNode;
}) {
    return <>{can(useRole(), resource, action) ? children : fallback}</>;
}

/** Guard di route: senza sessione rimanda al login, ricordando la destinazione. */
export function RequireAuth({ children }: { children: ReactNode }) {
    const session = useSession();
    const location = useLocation();
    if (!session) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
    return <>{children}</>;
}
