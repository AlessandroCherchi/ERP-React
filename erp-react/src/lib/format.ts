// Porting 1:1 delle utility di formattazione da erp-ui.js.
// Nessuna logica cambiata: stessa i/o, stessa localizzazione it-IT.

export function formatEuro(value: number | string, decimals = 2): string {
    const d = decimals == null ? 2 : decimals;
    const n = Number(value) || 0;
    return '€ ' + n.toLocaleString('it-IT', {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
    });
}

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
