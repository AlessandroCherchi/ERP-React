import { Pagination } from '../ui/Pagination';
import { formatEuro } from '../../lib/format';
import { labelPagamento, STATO_FORNITORE_LABEL, type Fornitore } from '../../types/fornitore';
import type { SortDir } from '../../lib/tableUtils';

type SortKey = 'id' | 'nome' | 'categoria' | 'citta' | 'leadTime' | 'acquistato' | 'debito';

interface FornitoreTableProps {
    rows: Fornitore[];
    sortKey: SortKey;
    sortDir: SortDir;
    onSort: (key: SortKey) => void;
    onView: (id: number) => void;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
    total: number;
    currentPage: number;
    totalPages: number;
    perPage: number;
    onPageChange: (page: number) => void;
}

const COLUMNS: { key: SortKey | null; label: string }[] = [
    { key: 'id', label: '#' },
    { key: 'nome', label: 'Fornitore' },
    { key: 'categoria', label: 'Categoria' },
    { key: 'citta', label: 'Città' },
    { key: 'leadTime', label: 'Lead time' },
    { key: null, label: 'Pagamento' },
    { key: 'acquistato', label: 'Acquistato' },
    { key: 'debito', label: 'Debito' },
    { key: null, label: 'Stato' },
    { key: null, label: 'Azioni' },
];

function initials(nome: string): string {
    return nome.split(' ').map((w) => w.charAt(0)).join('').substring(0, 2).toUpperCase();
}

/** Tabella fornitori — stessa struttura di ClientTable, paginazione condivisa. */
export function FornitoreTable({
    rows, sortKey, sortDir, onSort, onView, onEdit, onDelete,
    total, currentPage, totalPages, perPage, onPageChange,
}: FornitoreTableProps) {
    return (
        <section className="neu-panel table-panel">
            <div className="table-wrapper">
                <table className="neu-table">
                    <thead>
                        <tr>
                            {COLUMNS.map((col) => (
                                <th
                                    key={col.label}
                                    scope="col"
                                    className={col.key ? `th-sortable${sortKey === col.key ? ` sort-${sortDir}` : ''}` : undefined}
                                    onClick={col.key ? () => onSort(col.key as SortKey) : undefined}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={COLUMNS.length}>
                                    <div className="empty-state">
                                        <i className="fa-solid fa-truck-field" />
                                        <p>Nessun fornitore trovato.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            rows.map((f) => (
                                <tr key={f.id} className={f.stato === 'sospeso' ? 'row--alert' : undefined}>
                                    <td>{f.id}</td>
                                    <td>
                                        <div
                                            className="client-name-cell"
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => onView(f.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    onView(f.id);
                                                }
                                            }}
                                        >
                                            <div className="client-avatar-sm">{initials(f.nome)}</div>
                                            <span className="client-name-text">{f.nome}</span>
                                        </div>
                                    </td>
                                    <td>{f.categoria}</td>
                                    <td>{f.citta || '—'}</td>
                                    <td>{f.leadTime} gg</td>
                                    <td>{labelPagamento(f.pagamento)}</td>
                                    <td style={{ fontWeight: 600 }}>{formatEuro(f.acquistato, 0)}</td>
                                    <td style={{ fontWeight: 600 }}>{formatEuro(f.debito, 0)}</td>
                                    <td>
                                        <span className={`status-badge status-badge--${f.stato}`}>
                                            {STATO_FORNITORE_LABEL[f.stato]}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button
                                                type="button"
                                                className="neu-icon-btn neu-icon-btn--sm"
                                                title="Dettaglio"
                                                aria-label={`Dettaglio ${f.nome}`}
                                                onClick={(e) => { e.stopPropagation(); onView(f.id); }}
                                            >
                                                <i className="fa-solid fa-eye" />
                                            </button>
                                            <button
                                                type="button"
                                                className="neu-icon-btn neu-icon-btn--sm"
                                                title="Modifica"
                                                aria-label={`Modifica ${f.nome}`}
                                                onClick={(e) => { e.stopPropagation(); onEdit(f.id); }}
                                            >
                                                <i className="fa-solid fa-pen" />
                                            </button>
                                            <button
                                                type="button"
                                                className="neu-icon-btn neu-icon-btn--sm"
                                                title="Elimina"
                                                aria-label={`Elimina ${f.nome}`}
                                                onClick={(e) => { e.stopPropagation(); onDelete(f.id); }}
                                            >
                                                <i className="fa-solid fa-trash-can" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination
                total={total}
                currentPage={currentPage}
                totalPages={totalPages}
                perPage={perPage}
                onPageChange={onPageChange}
            />
        </section>
    );
}

export type { SortKey };
