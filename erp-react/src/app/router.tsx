// Router dell'app: modulo di configurazione, non un componente soggetto a fast refresh.
/* oxlint-disable react/only-export-components */
import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MODULES, type ModuleDef } from './modules';
import { useModuleAccess } from './useModules';
import { RequireAuth } from '../auth/guards';
import { ComingSoon, Forbidden, ModuleDisabled, NotFound, RouteError } from '../pages/system';
import { PageLoader } from '../components/ui/PageLoader';

const Login = lazy(() => import('../pages/Login').then((m) => ({ default: m.Login })));

function withSuspense(el: ReactNode) {
    return <Suspense fallback={<PageLoader />}>{el}</Suspense>;
}

/**
 * Accesso a un modulo: attivo per il tenant? leggibile dal ruolo?
 * Controllato a ogni render (non alla creazione del router) così un cambio
 * di tenant o di utente ha effetto senza ricaricare la pagina.
 */
function ModuleRoute({ module }: { module: ModuleDef }) {
    const access = useModuleAccess(module);
    if (access === 'disabled') return <ModuleDisabled />;
    if (access === 'forbidden') return <Forbidden />;
    if (!module.page) return <ComingSoon module={module} />;
    const Page = module.page;
    return withSuspense(<Page />);
}

// React Router "Data mode" — Implementation Contract v3.1 §1: unica modalità.
// Le route dei moduli sono generate dal registro (app/modules.ts).
export const router = createBrowserRouter([
    {
        path: '/',
        errorElement: <RouteError />,
        children: [
            { index: true, element: <Navigate to="/dashboard" replace /> },
            { path: 'login', element: withSuspense(<Login />) },
            ...MODULES.map((m) => ({
                path: m.path.slice(1),
                element: <RequireAuth><ModuleRoute module={m} /></RequireAuth>,
            })),
            { path: '*', element: <NotFound /> },
        ],
    },
]);
