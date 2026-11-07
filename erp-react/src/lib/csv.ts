import { downloadCsv, today } from './format';

/** Colonna di export: intestazione + valore della riga. */
export interface CsvColumn<T> {
    header: string;
    value: (row: T) => unknown;
}

/**
 * Esporta righe tipizzate in CSV (UTF-8 con BOM, apribile da Excel).
 * Il nome file prende la data odierna: `<base>_export_<yyyy-mm-dd>.csv`.
 */
export function exportCsv<T>(base: string, rows: readonly T[], columns: CsvColumn<T>[]): void {
    downloadCsv(
        `${base}_export_${today()}.csv`,
        columns.map((c) => c.header),
        rows.map((r) => columns.map((c) => c.value(r)))
    );
}
