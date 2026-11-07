// Derivazione della palette dal colore di brand.
// In Impostazioni l'utente sceglie UN colore primario (e opzionalmente uno
// secondario): le varianti chiare/scure usate da gradienti, ombre e stati
// attivi si calcolano qui, così qualsiasi brand resta coerente.

import { hexToRgbTriplet, type ThemeTokens } from './theme';

function toRgb(hex: string): [number, number, number] {
    const t = hexToRgbTriplet(hex);
    if (!t) throw new Error(`Colore non valido: ${hex}`);
    return t.split(',').map((x) => Number(x.trim())) as [number, number, number];
}

function toHex([r, g, b]: [number, number, number]): string {
    return '#' + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');
}

/** Miscela lineare in RGB: ratio 0 = colore originale, 1 = target. */
export function mix(hex: string, target: string, ratio: number): string {
    const a = toRgb(hex);
    const b = toRgb(target);
    return toHex([0, 1, 2].map((i) => a[i]! + (b[i]! - a[i]!) * ratio) as [number, number, number]);
}

export function isHexColor(value: string): boolean {
    return hexToRgbTriplet(value) !== null;
}

/** Token di brand derivati dal colore primario (e dal secondario, se dato). */
export function derivePalette(primary: string, secondary?: string): ThemeTokens {
    const tokens: ThemeTokens = {
        '--erp-accent': primary,
        '--erp-accent-light': mix(primary, '#ffffff', 0.1),
        '--erp-accent-bright': mix(primary, '#ffffff', 0.3),
        '--erp-accent-dark': mix(primary, '#000000', 0.23),
        '--erp-accent-deep': mix(primary, '#000000', 0.3),
        '--erp-accent-shadow': mix(primary, '#000000', 0.75),
    };
    if (secondary) {
        tokens['--erp-gold-strong'] = secondary;
        tokens['--erp-gold'] = mix(secondary, '#ffffff', 0.8);
    }
    return tokens;
}

/** Token di brand che derivePalette gestisce: un reset li rimuove tutti. */
export const BRAND_TOKENS = [
    '--erp-accent', '--erp-accent-light', '--erp-accent-bright', '--erp-accent-dark',
    '--erp-accent-deep', '--erp-accent-shadow', '--erp-gold', '--erp-gold-strong',
] as const;
