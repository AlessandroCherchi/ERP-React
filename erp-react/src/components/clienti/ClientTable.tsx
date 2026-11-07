import { Pagination } from '../ui/Pagination';
import type { Cliente } from '../../types/cliente';

type SortKey = 'id' | 'nome' | 'email' | 'citta' | 'fatturato' | 'stato';
type SortDir = 'asc' | 'desc';

interface ClientTableProps {
    rows: Cliente[];
    sortKey: SortKey;
    sortDir: SortDir;
    onSort: (key: SortKey) => void;
    onView: (id: number) => void;
    onEdit?: (id: number) => void;
    onDelete?: (id: number) => void;
    total: number;
    currentPage: number;
    totalPages: number;
    perPage: number;
    onPageChange: (page: number) => void;
}

const COLUMNS: { key: SortKey | null; label: string }[] = [
    { key: 'id', label: '#' },
    { key: 'nome', label: 'Cliente' },
    { key: 'email', label: 'Email' },
    { key: null, label: 'Telefono' },
    { key: 'citta', label: 'Città' },
    { key: 'fatturato', label: 'Fatturato' },
    { key: 'stato', label: 'Stato' },
    { key: null, label: 'Azioni' },
];

function initials(nome: string): string {
    return nome.split(' ').map((w) => w.charAt(0)).join('').substring(0, 2);
}

function capitalise(str: string): string {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

/** Tabella clienti con sort/paginazione — porting 1:1 di renderTable()/renderPagination() in clienti.js. */
export function ClientTable({
    rows, sortKey, sortDir, onSort, onView, onEdit, onDelete,
    total, currentPage, totalPages, perPage, onPageChange,
}: ClientTableProps) {

    return (
        <section className="neu-panel table-panel">
            <div className="table-wrapper">
                <table className="neu-table">
                    <thead>
                        <tr>
                            {COLUMNS.map((col) => (
                                <th
                                    key={col.label}
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
                                <td colSpan={8}>
                                    <div className="empty-state">
                                        <i className="fa-solid fa-users-slash" />
                                        <p>Nessun cliente trovato.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            rows.map((c) => (
                                <tr key={c.id}>
                                    <td>{c.id}</td>
                                    <td>
                                        <div className="client-name-cell" onClick={() => onView(c.id)}>
                                            <div className="client-avatar-sm">{initials(c.nome)}</div>
                                            <span className="client-name-text">{c.nome}</span>
                                        </div>
                                    </td>
                                    <td>{c.email}</td>
                                    <td>{c.telefono}</td>
                                    <td>{c.citta}</td>
                                    <td style={{ fontWeight: 600 }}>€ {c.fatturato.toLocaleString('it-IT')}</td>
                                    <td>
                                        <span className={`status-badge status-badge--${c.stato}`}>{capitalise(c.stato)}</span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button
                                                className="neu-icon-btn neu-icon-btn--sm"
                                                title="Dettaglio"
                                                aria-label="Vedi dettaglio"
                                                onClick={(e) => { e.stopPropagation(); onView(c.id); }}
                                            >
                                                <i className="fa-solid fa-eye" />
                                            </button>
                                            {onEdit && (
                                                <button
                                                    className="neu-icon-btn neu-icon-btn--sm"
                                                    title="Modifica"
                                                    aria-label="Modifica"
                                                    onClick={(e) => { e.stopPropagation(); onEdit(c.id); }}
                                                >
                                                    <i className="fa-solid fa-pen" />
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    className="neu-icon-btn neu-icon-btn--sm"
                                                    title="Elimina"
                                                    aria-label="Elimina"
                                                    onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                                                >
                                                    <i className="fa-solid fa-trash-can" />
                                                </button>
                                            )}
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

export type { SortKey, SortDir };
