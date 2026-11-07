// Utility di formattazione (porting da erp-ui.js), rese locale/valuta-aware:
// locale e valuta arrivano dal config del tenant via configureFormat().

interface FormatSettings {
    intl: string;
    currency: string;
}

/**
 * Locale e valuta correnti, impostati dal config del tenant
 * (config/configStore.ts). Modulo-level perché i formattatori sono
 * chiamati ovunque, anche fuori da React.
 */
let settings: FormatSettings = { intl: 'it-IT', currency: 'EUR' };
let currencySymbol = '€';

export function configureFormat(next: FormatSettings): void {
    settings = next;
    try {
        currencySymbol = new Intl.NumberFormat(next.intl, { style: 'currency', currency: next.currency })
            .formatToParts(0)
            .find((p) => p.type === 'currency')?.value ?? next.currency;
    } catch {
        currencySymbol = next.currency;
    }
}

/** Locale Intl corrente (per toLocaleString/toLocaleDateString). */
export function currentLocale(): string {
    return settings.intl;
}

/** Numero localizzato (separatori del locale del tenant). */
export function formatNumber(value: number, decimals = 0): string {
    return (Number(value) || 0).toLocaleString(settings.intl, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

/**
 * Importo nella valuta del tenant, simbolo in testa ("€ 1.234,00") come nel
 * design originale. Il nome resta formatEuro per non toccare ~40 chiamanti:
 * la valuta effettiva è quella del config.
 */
export function formatEuro(value: number | string, decimals = 2): string {
    const d = decimals == null ? 2 : decimals;
    return `${currencySymbol} ${formatNumber(Number(value) || 0, d)}`;
}

/** Alias semantico di formatEuro per il codice nuovo. */
export const formatMoney = formatEuro;

export function parseNum(value: unknown): number {
    const n = parseFloat(String(value ?? '').replace(',', '.'));
    return Number.isNaN(n) ? 0 : n;
}

export function today(): string {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function formatDate(iso: string | null | undefined): string {
    if (!iso) return '';
    const parts = String(iso).split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : iso;
}

export function downloadFile(filename: string, content: string, mime = 'text/plain;charset=utf-8;'): void {
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

const BOM = '﻿';

export function downloadCsv(filename: string, headers: string[], rows: Array<Array<unknown>>): void {
    const quote = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [headers.map(quote).join(',')]
        .concat(rows.map((row) => row.map(quote).join(',')))
        .join('\n');
    downloadFile(filename, BOM + csv, 'text/csv;charset=utf-8;');
}

export function downloadJson(filename: string, data: unknown): void {
    downloadFile(filename, JSON.stringify(data, null, 2), 'application/json;charset=utf-8;');
}

/** "3 minuti fa", "ieri"… nel locale del tenant. */
export function tempoFa(iso: string, now: Date = new Date()): string {
    const diff = (new Date(iso).getTime() - now.getTime()) / 1000;
    const rtf = new Intl.RelativeTimeFormat(settings.intl, { numeric: 'auto' });
    const abs = Math.abs(diff);
    if (abs < 60) return rtf.format(Math.round(diff), 'second');
    if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
    if (abs < 86_400) return rtf.format(Math.round(diff / 3600), 'hour');
    return rtf.format(Math.round(diff / 86_400), 'day');
}

/** Etichetta breve di un mese yyyy-mm ("ago 26"). */
export function etichettaMese(mese: string): string {
    return new Date(`${mese}-01T00:00:00`).toLocaleDateString(settings.intl, { month: 'short', year: '2-digit' });
}
