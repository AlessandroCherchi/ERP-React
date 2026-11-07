import type { NumberingRule } from './types';

/** Formatta un progressivo secondo la regola: prefisso + numero con padding. */
export function formatNumber(rule: NumberingRule, n: number): string {
    return rule.prefix + (rule.pad > 0 ? String(n).padStart(rule.pad, '0') : String(n));
}

/**
 * Prossimo codice libero leggendo quelli già assegnati.
 * Considera solo i codici con il prefisso della regola: dopo un cambio di
 * prefisso i vecchi codici non devono far saltare la numerazione nuova.
 *
 * Suggerimento lato client: l'unicità in concorrenza la garantisce solo il
 * backend (spec §2 — e per i documenti fiscali è un obbligo di legge).
 */
export function nextNumber(rule: NumberingRule, existing: readonly string[]): string {
    const max = existing.reduce((acc, code) => {
        if (!code.startsWith(rule.prefix)) return acc;
        const n = Number(code.slice(rule.prefix.length).replace(/\D/g, ''));
        return Number.isFinite(n) && n > acc ? n : acc;
    }, rule.start);
    return formatNumber(rule, max + 1);
}
