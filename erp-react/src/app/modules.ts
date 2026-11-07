// Registro dei moduli: UNICA dichiarazione di route + voce di menu +
// permesso richiesto. Sidebar e router si generano da qui, filtrati per
// config del tenant (moduli attivi) e ruolo dell'utente (permission §5).
// Aggiungere un modulo = una riga qui + la pagina.

import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { ModuleId } from './moduleIds';
import type { Resource } from '../auth/permissions';
import type { TKey } from '../i18n';

export interface ModuleDef {
    id: ModuleId;
    path: string;
    /** Classe Font Awesome (set "solid"). */
    icon: string;
    labelKey: TKey;
    /** Risorsa della permission matrix: serve "read" per vedere il modulo. */
    resource: Resource;
    placement: 'main' | 'footer';
    /** Pagina del modulo. Assente = modulo in roadmap (pagina "in sviluppo"). */
    page?: LazyExoticComponent<ComponentType>;
}

const page = <K extends string>(loader: () => Promise<Record<K, ComponentType>>, name: K) =>
    lazy(() => loader().then((m) => ({ default: m[name] })));

export const MODULES: ModuleDef[] = [
    { id: 'dashboard', path: '/dashboard', icon: 'fa-table-cells-large', labelKey: 'nav.dashboard', resource: 'ordini', placement: 'main',
      page: page(() => import('../pages/Dashboard'), 'Dashboard') },
    { id: 'vendite', path: '/vendite', icon: 'fa-chart-line', labelKey: 'nav.vendite', resource: 'ordini', placement: 'main',
      page: page(() => import('../pages/Vendite'), 'Vendite') },
    { id: 'acquisti', path: '/acquisti', icon: 'fa-cart-flatbed', labelKey: 'nav.acquisti', resource: 'ordini', placement: 'main' },
    { id: 'inventario', path: '/inventario', icon: 'fa-boxes-stacked', labelKey: 'nav.inventario', resource: 'magazzino', placement: 'main',
      page: page(() => import('../pages/Inventario'), 'Inventario') },
    { id: 'clienti', path: '/clienti', icon: 'fa-users', labelKey: 'nav.clienti', resource: 'anagrafiche', placement: 'main',
      page: page(() => import('../pages/Clienti'), 'Clienti') },
    { id: 'fornitori', path: '/fornitori', icon: 'fa-truck-field', labelKey: 'nav.fornitori', resource: 'anagrafiche', placement: 'main',
      page: page(() => import('../pages/Fornitori'), 'Fornitori') },
    { id: 'fatture', path: '/fatture', icon: 'fa-file-invoice-dollar', labelKey: 'nav.fatture', resource: 'fatture', placement: 'main' },
    { id: 'contabilita', path: '/contabilita', icon: 'fa-calculator', labelKey: 'nav.contabilita', resource: 'fatture', placement: 'main' },
    { id: 'report', path: '/report', icon: 'fa-chart-pie', labelKey: 'nav.report', resource: 'ordini', placement: 'main' },
    { id: 'impostazioni', path: '/impostazioni', icon: 'fa-gear', labelKey: 'nav.impostazioni', resource: 'impostazioni', placement: 'footer' },
];

export function getModule(id: ModuleId): ModuleDef {
    const m = MODULES.find((x) => x.id === id);
    if (!m) throw new Error(`Modulo sconosciuto: ${id}`);
    return m;
}
