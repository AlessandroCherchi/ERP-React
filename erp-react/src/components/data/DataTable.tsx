import type { ReactNode } from 'react';
import { Pagination } from '../ui/Pagination';
import { useT } from '../../i18n';
import type { SortDir } from '../../lib/tableUtils';

/** Colonna della tabella. `sortKey` assente = colonna non ordinabile. */
export interface Column<T, K extends string = string> {
    id: string;
    header: string;
    sortKey?: K;
    cell: (row: T) => ReactNode;
    /** Classe della <td> (allineamenti, enfasi). */
    className?: string;
}

/** Azione di riga (icona). Assente dall'array = non permessa al ruolo. */
export interface RowAction<T> {
    id: string;
    icon: string;
    label: string;
    onClick: (row: T) => void;
    /** Azione visibile ma non eseguibile su questa riga (con motivazione nel tooltip). */
    disabled?: (row: T) => string | false;
}

export interface DataTableProps<T extends { id: number | string }, K extends string> {
    rows: T[];
    columns: Column<T, K>[];
    sortKey: K;
    sortDir: SortDir;
    onSort: (key: K) => void;
    actions?: RowAction<T>[];
    rowClassName?: (row: T) => string | undefined;
    /** Nome leggibile della riga, per le aria-label delle azioni. */
    rowLabel: (row: T) => string;
    empty: { icon: string; text: string };
    pagination: {
        total: number;
        page: number;
        totalPages: number;
        pageSize: number;
        onPageChange: (page: number) => void;
    };
}

/**
 * Tabella elenco generica: intestazioni ordinabili, azioni di riga,
 * empty state e paginazione. Le pagine dichiarano solo colonne e azioni;
 * markup, accessibilità e classi CSS (app-shell.css) vivono qui una volta.
 */
export function DataTable<T extends { id: number | string }, K extends string>({
    rows, columns, sortKey, sortDir, onSort, actions = [], rowClassName, rowLabel, empty, pagination,
}: DataTableProps<T, K>) {
    const t = useT();
    const colSpan = columns.length + (actions.length ? 1 : 0);

    return (
        <section className="neu-panel table-panel">
            <div className="table-wrapper">
                <table className="neu-table">
                    <thead>
                        <tr>
                            {columns.map((col) => {
                                const sortable = col.sortKey !== undefined;
                                const active = sortable && sortKey === col.sortKey;
                                return (
                                    <th
                                        key={col.id}
                                        scope="col"
                                        className={sortable ? `th-sortable${active ? ` sort-${sortDir}` : ''}` : undefined}
                                        aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                                    >
                                        {sortable ? (
                                            <button
                                                type="button"
                                                className="th-sort-btn"
                                                onClick={() => onSort(col.sortKey!)}
                                                aria-label={t('table.sortBy', { column: col.header })}
                                            >
                                                {col.header}
                                            </button>
                                        ) : col.header}
                                    </th>
                                );
                            })}
                            {actions.length > 0 && <th scope="col">{t('table.actions')}</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={colSpan}>
                                    <div className="empty-state">
                                        <i className={`fa-solid ${empty.icon}`} />
                                        <p>{empty.text}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : rows.map((row) => (
                            <tr key={row.id} className={rowClassName?.(row)}>
                                {columns.map((col) => (
                                    <td key={col.id} className={col.className}>{col.cell(row)}</td>
                                ))}
                                {actions.length > 0 && (
                                    <td>
                                        <div className="table-actions">
                                            {actions.map((a) => {
                                                const reason = a.disabled?.(row) || false;
                                                return (
                                                    <button
                                                        key={a.id}
                                                        type="button"
                                                        className="neu-icon-btn neu-icon-btn--sm"
                                                        title={reason || a.label}
                                                        aria-label={`${a.label} ${rowLabel(row)}`}
                                                        disabled={Boolean(reason)}
                                                        onClick={(e) => { e.stopPropagation(); a.onClick(row); }}
                                                    >
                                                        <i className={`fa-solid ${a.icon}`} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination
                total={pagination.total}
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                perPage={pagination.pageSize}
                onPageChange={pagination.onPageChange}
            />
        </section>
    );
}

/** Cella "avatar + nome" cliccabile che apre il dettaglio (accessibile da tastiera). */
export function EntityCell({ icon, label, onOpen }: { icon: ReactNode; label: string; onOpen: () => void }) {
    return (
        <button type="button" className="client-name-cell entity-cell" onClick={onOpen}>
            <span className="client-avatar-sm">{icon}</span>
            <span className="client-name-text">{label}</span>
        </button>
    );
}
