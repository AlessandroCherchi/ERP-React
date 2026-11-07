import type { TenantConfig, TenantOverride } from './types';

/**
 * Fonde l'override del tenant sulla configurazione base.
 * Un livello di profondità basta per la forma di TenantConfig; gli array
 * (es. categorie) SOSTITUISCONO quelli di base invece di concatenarsi:
 * un cliente che dichiara le sue categorie non vuole anche le nostre.
 */
export function mergeConfig(base: TenantConfig, override: TenantOverride): TenantConfig {
    const out = { ...base } as Record<string, unknown>;
    for (const [key, value] of Object.entries(override)) {
        if (value === undefined) continue;
        const current = (base as unknown as Record<string, unknown>)[key];
        const isPlainObject = (x: unknown) => typeof x === 'object' && x !== null && !Array.isArray(x);
        out[key] = isPlainObject(value) && isPlainObject(current)
            ? { ...(current as object), ...(value as object) }
            : value;
    }
    return out as unknown as TenantConfig;
}
