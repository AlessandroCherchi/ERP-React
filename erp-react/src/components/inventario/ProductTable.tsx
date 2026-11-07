import { Pagination } from '../ui/Pagination';
import { StockBar } from './StockBar';
import { formatEuro } from '../../lib/format';
import { statoProdotto, STATO_LABEL, valoreGiacenza, type Prodotto } from '../../types/prodotto';

type SortKey = 'sku' | 'nome' | 'categoria' | 'giacenza' | 'prezzo' | 'valore';
type SortDir = 'asc' | 'desc';

interface ProductTableProps {
    rows: Prodotto[];
    sortKey: SortKey;
    sortDir: SortDir;
    onSort: (key: SortKey) => void;
    onView: (id: number) => void;
    onMove: (id: number) => void;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
    total: number;
    currentPage: number;
    totalPages: number;
    perPage: number;
    onPageChange: (page: number) => void;
}

const COLUMNS: { key: SortKey | null; label: string }[] = [
    { key: 'sku', label: 'SKU' },
    { key: 'nome', label: 'Prodotto' },
    { key: 'categoria', label: 'Categoria' },
    { key: null, label: 'Fornitore' },
    { key: 'giacenza', label: 'Giacenza' },
    { key: 'prezzo', label: 'Prezzo' },
    { key: 'valore', label: 'Valore' },
    { key: null, label: 'Stato' },
    { key: null, label: 'Azioni' },
];

/** Icona rappresentativa della categoria — coerente con la nav (nessuna emoji). */
const CATEGORIA_ICON: Record<string, string> = {
    Elettronica: 'fa-microchip',
    Componenti: 'fa-gears',
    Illuminazione: 'fa-lightbulb',
    Networking: 'fa-network-wired',
    Accessori: 'fa-screwdriver-wrench',
};

/** Tabella articoli di magazzino — stessa struttura/paginazione di ClientTable. */
export function ProductTable({
    rows, sortKey, sortDir, onSort, onView, onMove, onEdit, onDelete,
    total, currentPage, totalPages, perPage, onPageChange,
}: ProductTableProps) {

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
                                        <i className="fa-solid fa-boxes-packing" />
                                        <p>Nessun articolo trovato.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            rows.map((p) => {
                                const stato = statoProdotto(p);
                                return (
                                    <tr key={p.id} className={stato !== 'disponibile' ? 'row--alert' : undefined}>
                                        <td className="cell-sku">{p.sku}</td>
                                        <td>
                                            <div
                                                className="client-name-cell"
                                                onClick={() => onView(p.id)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        onView(p.id);
                                                    }
                                                }}
                                            >
                                                <div className="client-avatar-sm">
                                                    <i className={`fa-solid ${CATEGORIA_ICON[p.categoria] ?? 'fa-box'}`} />
                                                </div>
                                                <span className="client-name-text">{p.nome}</span>
                                            </div>
                                        </td>
                                        <td>{p.categoria}</td>
                                        <td>{p.fornitore || '—'}</td>
                                        <td>
                                            <StockBar giacenza={p.giacenza} scorta={p.scorta} unita={p.unita} />
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{formatEuro(p.prezzo)}</td>
                                        <td style={{ fontWeight: 600 }}>{formatEuro(valoreGiacenza(p), 0)}</td>
                                        <td>
                                            <span className={`status-badge status-badge--${stato}`}>{STATO_LABEL[stato]}</span>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button
                                                    type="button"
                                                    className="neu-icon-btn neu-icon-btn--sm"
                                                    title="Dettaglio"
                                                    aria-label={`Dettaglio ${p.nome}`}
                                                    onClick={(e) => { e.stopPropagation(); onView(p.id); }}
                                                >
                                                    <i className="fa-solid fa-eye" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="neu-icon-btn neu-icon-btn--sm"
                                                    title="Movimento di magazzino"
                                                    aria-label={`Registra movimento per ${p.nome}`}
                                                    onClick={(e) => { e.stopPropagation(); onMove(p.id); }}
                                                >
                                                    <i className="fa-solid fa-right-left" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="neu-icon-btn neu-icon-btn--sm"
                                                    title="Modifica"
                                                    aria-label={`Modifica ${p.nome}`}
                                                    onClick={(e) => { e.stopPropagation(); onEdit(p.id); }}
                                                >
                                                    <i className="fa-solid fa-pen" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="neu-icon-btn neu-icon-btn--sm"
                                                    title="Elimina"
                                                    aria-label={`Elimina ${p.nome}`}
                                                    onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}
                                                >
                                                    <i className="fa-solid fa-trash-can" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
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
