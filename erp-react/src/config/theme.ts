// Applicazione del tema a runtime.
// Il tenant dichiara solo colori hex; per i token che hanno una variante
// "-rgb" (usata nei rgba() con trasparenza) la tripletta è derivata qui,
// così un cliente non può avere accento e ombre dell'accento disallineati.

/** Token colore sovrascrivibili. */
export type ColorToken =
    | '--erp-bg' | '--erp-bg-light' | '--erp-light'
    | '--erp-text' | '--erp-text-strong' | '--erp-text-soft' | '--erp-text-muted'
    | '--erp-neutral-300' | '--erp-neutral-400' | '--erp-neutral-500' | '--erp-neutral-600'
    | '--erp-shadow-light' | '--erp-shadow-dark' | '--erp-shadow-dark-2' | '--erp-shadow-cool'
    | '--erp-accent' | '--erp-accent-light' | '--erp-accent-bright' | '--erp-accent-dark'
    | '--erp-accent-deep' | '--erp-accent-shadow' | '--erp-gold' | '--erp-gold-strong'
    | '--erp-success' | '--erp-success-light' | '--erp-warning' | '--erp-error'
    | '--erp-error-dark' | '--erp-info' | '--erp-info-dark' | '--erp-black';

/** Token non colore sovrascrivibili. */
export type ShapeToken = '--erp-radius' | '--erp-radius-lg' | '--erp-font';

export type ThemeTokens = Partial<Record<ColorToken | ShapeToken, string>>;

/** Token colore che hanno una tripletta -rgb in tokens.css. */
const WITH_RGB = new Set<ColorToken>([
    '--erp-light', '--erp-black', '--erp-text-muted', '--erp-text-soft', '--erp-neutral-400',
    '--erp-shadow-dark', '--erp-shadow-cool', '--erp-accent', '--erp-accent-bright',
    '--erp-accent-deep', '--erp-accent-shadow', '--erp-gold-strong', '--erp-success',
    '--erp-warning', '--erp-error', '--erp-info', '--erp-info-dark',
]);

/** "#a10f0f" | "#fff" → "161, 15, 15". null se il valore non è un hex valido. */
export function hexToRgbTriplet(hex: string): string | null {
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return null;
    let h = m[1]!;
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

/** Espande gli override del tenant nelle proprietà CSS effettive (incluse le -rgb). */
export function resolveThemeVars(theme: ThemeTokens): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [token, value] of Object.entries(theme)) {
        if (!value) continue;
        out[token] = value;
        if (WITH_RGB.has(token as ColorToken)) {
            const rgb = hexToRgbTriplet(value);
            if (rgb) out[`${token}-rgb`] = rgb;
        }
    }
    return out;
}

let applied: string[] = [];

/** Applica il tema a :root, rimuovendo gli override del tenant precedente. */
export function applyTheme(theme: ThemeTokens, root: HTMLElement = document.documentElement): void {
    for (const prop of applied) root.style.removeProperty(prop);
    const vars = resolveThemeVars(theme);
    for (const [prop, value] of Object.entries(vars)) root.style.setProperty(prop, value);
    applied = Object.keys(vars);
}

/**
 * Valore corrente di un token CSS, per chi disegna fuori dal CSS (canvas
 * dei grafici). Letto al momento del disegno: segue il tema del tenant.
 */
export function readToken(name: string, fallback: string): string {
    if (typeof document === 'undefined') return fallback;
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
}
