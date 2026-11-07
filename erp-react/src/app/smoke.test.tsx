// @vitest-environment jsdom
//
// Smoke test dell'app intera: router, guard, registro moduli, permessi,
// tenant. Non verifica il layout (lo farà Playwright), ma garantisce che
// ogni route si monti senza errori per ogni ruolo e che la shell rispetti
// config e permission matrix.

import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { App } from '../App';
import { router } from './router';
import { AppProviders } from './AppProviders';
import { MODULES } from './modules';
import { useAuthStore, DEMO_USERS } from '../auth/session';
import { useConfigStore } from '../config/configStore';
import type { Role } from '../auth/permissions';

beforeAll(() => {
    // jsdom non implementa canvas: i grafici devono degradare senza crash.
    HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;
    // né gli observer usati da KPI animati e grafici responsivi
    class NoopObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() { return []; }
    }
    globalThis.IntersectionObserver ??= NoopObserver as unknown as typeof IntersectionObserver;
    globalThis.ResizeObserver ??= NoopObserver as unknown as typeof ResizeObserver;
});

afterEach(() => {
    cleanup();
    useAuthStore.getState().logout();
    useConfigStore.getState().setTenant('default');
});

async function loginAs(role: Role) {
    const user = DEMO_USERS.find((u) => u.role === role)!;
    await act(() => useAuthStore.getState().login(user.email, 'demo', { remember: false, tenantId: 'default' }));
}

async function renderAt(path: string) {
    await act(() => router.navigate(path));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<AppProviders client={client}><App /></AppProviders>);
}

describe('guard di autenticazione', () => {
    it('senza sessione ogni modulo rimanda al login', async () => {
        await renderAt('/clienti');
        expect(await screen.findByRole('heading', { name: 'Accedi' })).toBeTruthy();
        expect(router.state.location.pathname).toBe('/login');
    });

    it('route inesistente → 404', async () => {
        await loginAs('owner');
        await renderAt('/non-esiste');
        expect(await screen.findAllByText('Pagina non trovata')).not.toHaveLength(0);
    });
});

describe('ogni modulo si monta per ogni ruolo', () => {
    for (const role of ['owner', 'admin', 'accounting', 'warehouse', 'viewer'] as Role[]) {
        for (const m of MODULES) {
            it(`${role} → ${m.path}`, async () => {
                await loginAs(role);
                await renderAt(m.path);
                // la shell è presente (sidebar) e nessun errore di route
                expect(await screen.findByText('ERP Suite')).toBeTruthy();
                expect(screen.queryByText('Si è verificato un errore')).toBeNull();
            });
        }
    }
});

describe('permessi nella UI', () => {
    it('owner vede "Nuovo Cliente", viewer no', async () => {
        await loginAs('owner');
        await renderAt('/clienti');
        expect(await screen.findByText('Rossi S.r.l.')).toBeTruthy();
        expect(screen.queryByRole('button', { name: /Nuovo Cliente/ })).not.toBeNull();
        cleanup();

        await loginAs('viewer');
        await renderAt('/clienti');
        expect(await screen.findByText('Rossi S.r.l.')).toBeTruthy();
        expect(screen.queryByRole('button', { name: /Nuovo Cliente/ })).toBeNull();
        expect(screen.queryAllByLabelText('Elimina')).toHaveLength(0);
    });

    it('magazzino non vede Impostazioni in menu e ne riceve accesso negato', async () => {
        await loginAs('warehouse');
        await renderAt('/impostazioni');
        expect(await screen.findAllByText('Accesso non consentito')).not.toHaveLength(0);
        expect(screen.queryByRole('link', { name: /Impostazioni/ })).toBeNull();
    });
});

describe('elenchi', () => {
    it('i filtri arrivano dall’URL', async () => {
        await loginAs('owner');
        await renderAt('/clienti?stato=prospect');
        expect(await screen.findByText('Arancio Design')).toBeTruthy();
        expect(screen.queryByText('Rossi S.r.l.')).toBeNull();
    });

    it('inventario mostra il fornitore risolto per id', async () => {
        await loginAs('owner');
        await renderAt('/inventario?q=SKU-4501');
        expect(await screen.findByText('Widget Pro X200')).toBeTruthy();
        expect(await screen.findByRole('cell', { name: 'Tecnoforniture S.p.A.' })).toBeTruthy();
    });
});

describe('tenant', () => {
    it('brand e moduli seguono il config del tenant', async () => {
        act(() => useConfigStore.getState().setTenant('acme'));
        await loginAs('owner');
        await renderAt('/dashboard');
        expect(await screen.findByText('ACME Magazzino')).toBeTruthy();
        expect(screen.queryByRole('link', { name: /Contabilità/ })).toBeNull();
        expect(document.documentElement.style.getPropertyValue('--erp-accent')).toBe('#1f4e9c');
        expect(document.documentElement.style.getPropertyValue('--erp-accent-rgb')).toBe('31, 78, 156');
    });

    it('modulo disattivato dal tenant → pagina dedicata', async () => {
        act(() => useConfigStore.getState().setTenant('acme'));
        await loginAs('owner');
        await renderAt('/contabilita');
        expect(await screen.findAllByText('Modulo non attivo')).not.toHaveLength(0);
    });
});
