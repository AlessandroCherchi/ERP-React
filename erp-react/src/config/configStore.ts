// Stato del config attivo.
// Zustand e non Context perché il config va letto anche fuori dall'albero
// React (mock API, formattatori) e perché le Impostazioni lo modificheranno
// a runtime: gli override locali sono persistiti per tenant.

import { create } from 'zustand';
import { DEFAULT_CONFIG } from './defaults';
import { mergeConfig } from './merge';
import { TENANTS } from './tenants';
import type { TenantConfig, TenantOverride } from './types';
import { safeStorage } from '../lib/storage';
import { applyTheme } from './theme';
import { configureFormat } from '../lib/format';

const TENANT_KEY = 'erp.tenant';

/**
 * Tenant attivo, in ordine di precedenza:
 * 1. ?tenant=<id> (solo in sviluppo: comodo per le demo, poi persistito)
 * 2. scelta precedente persistita
 * 3. VITE_TENANT (build dedicata a un cliente)
 * 4. default
 */
export function resolveTenantId(): string {
    if (import.meta.env.DEV && typeof window !== 'undefined') {
        const fromUrl = new URLSearchParams(window.location.search).get('tenant');
        if (fromUrl && TENANTS[fromUrl]) {
            safeStorage.set(TENANT_KEY, fromUrl);
            return fromUrl;
        }
    }
    const stored = safeStorage.get(TENANT_KEY);
    if (stored && TENANTS[stored]) return stored;
    const fromEnv = import.meta.env.VITE_TENANT as string | undefined;
    if (fromEnv && TENANTS[fromEnv]) return fromEnv;
    return 'default';
}

function overridesKey(tenantId: string) {
    return `erp.${tenantId}.config-overrides`;
}

function loadOverrides(tenantId: string): TenantOverride {
    const raw = safeStorage.get(overridesKey(tenantId));
    if (!raw) return {};
    try {
        return JSON.parse(raw) as TenantOverride;
    } catch {
        return {};
    }
}

export function buildConfig(tenantId: string, local: TenantOverride = {}): TenantConfig {
    const tenant = mergeConfig(DEFAULT_CONFIG, { id: tenantId, ...(TENANTS[tenantId] ?? {}) });
    return mergeConfig(tenant, local);
}

interface ConfigState {
    config: TenantConfig;
    /** Override locali (es. da Impostazioni), persistiti per tenant. */
    localOverrides: TenantOverride;
    setTenant: (tenantId: string) => void;
    updateConfig: (patch: TenantOverride) => void;
    resetLocalOverrides: () => void;
}

const initialTenant = resolveTenantId();
const initialOverrides = loadOverrides(initialTenant);

export const useConfigStore = create<ConfigState>((set, get) => ({
    config: buildConfig(initialTenant, initialOverrides),
    localOverrides: initialOverrides,

    setTenant: (tenantId) => {
        if (!TENANTS[tenantId]) return;
        safeStorage.set(TENANT_KEY, tenantId);
        const local = loadOverrides(tenantId);
        set({ config: buildConfig(tenantId, local), localOverrides: local });
    },

    updateConfig: (patch) => {
        const { config, localOverrides } = get();
        const local = mergeConfig(localOverrides as TenantConfig, patch) as TenantOverride;
        safeStorage.set(overridesKey(config.id), JSON.stringify(local));
        set({ config: buildConfig(config.id, local), localOverrides: local });
    },

    resetLocalOverrides: () => {
        const { config } = get();
        safeStorage.remove(overridesKey(config.id));
        set({ config: buildConfig(config.id), localOverrides: {} });
    },
}));

/**
 * Effetti del config fuori da React: tema su :root, titolo e lingua del
 * documento, locale/valuta dei formattatori. Eseguiti subito (prima del
 * primo render, niente flash del tema di default) e a ogni cambio.
 */
function syncEnvironment(config: TenantConfig) {
    configureFormat({ intl: config.locale.intl, currency: config.locale.currency });
    if (typeof document === 'undefined') return;
    applyTheme(config.theme);
    document.title = config.brand.name;
    document.documentElement.lang = config.locale.language;
}

syncEnvironment(useConfigStore.getState().config);
useConfigStore.subscribe((s, prev) => {
    if (s.config !== prev.config) syncEnvironment(s.config);
});

/** Config attivo — hook per i componenti. */
export function useConfig(): TenantConfig {
    return useConfigStore((s) => s.config);
}

/** Config attivo — lettura fuori da React (mock API, utility). */
export function getConfig(): TenantConfig {
    return useConfigStore.getState().config;
}

/** True se il modulo è attivo per il tenant corrente. */
export function isModuleEnabled(config: TenantConfig, id: string): boolean {
    return (config.modules as Record<string, boolean | undefined>)[id] !== false;
}
