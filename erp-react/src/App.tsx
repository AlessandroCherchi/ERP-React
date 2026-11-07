import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';

// Lazy per route: ogni pagina porta il proprio CSS legacy (body{}
// scoped a wrapper) in un chunk separato — nessuna collisione tra
// stylesheet di pagine diverse nel bundle unico.
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Clienti = lazy(() => import('./pages/Clienti').then((m) => ({ default: m.Clienti })));
const Inventario = lazy(() => import('./pages/Inventario').then((m) => ({ default: m.Inventario })));
const Fornitori = lazy(() => import('./pages/Fornitori').then((m) => ({ default: m.Fornitori })));
const Vendite = lazy(() => import('./pages/Vendite').then((m) => ({ default: m.Vendite })));

function withSuspense(el: React.ReactNode) {
    return <Suspense fallback={null}>{el}</Suspense>;
}

// React Router "Data mode" — Implementation Contract v3.1 §1:
// "Scegliere e documentare una sola modalità". Unica modalità in uso.
const router = createBrowserRouter([
    { path: '/', element: <Navigate to="/login" replace /> },
    { path: '/login', element: withSuspense(<Login />) },
    { path: '/dashboard', element: withSuspense(<Dashboard />) },
    { path: '/clienti', element: withSuspense(<Clienti />) },
    { path: '/inventario', element: withSuspense(<Inventario />) },
    { path: '/fornitori', element: withSuspense(<Fornitori />) },
    { path: '/vendite', element: withSuspense(<Vendite />) },
]);

export function App() {
    return <RouterProvider router={router} />;
}
