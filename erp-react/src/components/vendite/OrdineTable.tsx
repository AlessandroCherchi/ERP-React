import { Pagination } from '../ui/Pagination';
import { formatDate, formatEuro } from '../../lib/format';
import {
    PRIORITA_LABEL, STATO_ORDINE_LABEL, inRitardo, totaliOrdine, type Ordine,
} from '../../types/ordine';
import type { SortDir } from '../../lib/tableUtils';

type SortKey = 'numero' | 'cliente' | 'data' | 'consegna' | 'pezzi' | 'totale' | 'priorita' | 'stato';

interface OrdineTableProps {
    rows: Ordine[];
    sortKey: SortKey;
    sortDir: SortDir;
    onSort: (key: SortKey) => void;
    onView: (id: number) => void;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
    /** Data ISO di riferimento per il calcolo del ritardo. */
    oggi: string;
    total: number;
    currentPage: number;
    totalPages: number;
    perPage: number;
    onPageChange: (page: number) => void;
}

const COLUMNS: { key: SortKey | null; label: string }[] = [
    { key: 'numero', label: 'Ordine' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'data', label: 'Data' },
    { key: 'consegna', label: 'Consegna' },
    { key: 'pezzi', label: 'Articoli' },
    { key: 'totale', label: 'Totale' },
    { key: 'priorita', label: 'Priorità' },
    { key: 'stato', label: 'Stato' },
    { key: null, label: 'Azioni' },
];

/** Tabella ordini — stessa struttura di ClientTable/FornitoreTable. */
export function OrdineTable({
    rows, sortKey, sortDir, onSort, onView, onEdit, onDelete, oggi,
    total, currentPage, totalPages, perPage, onPageChange,
}: OrdineTableProps) {
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
                                        <i className="fa-solid fa-cart-shopping" />
                                        <p>Nessun ordine trovato.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            rows.map((o) => {
                                const totali = totaliOrdine(o.righe);
                                const ritardo = inRitardo(o, oggi);
                                // La modifica tocca le righe, quindi il magazzino:
                                // ammessa solo finché l'ordine non ha scaricato nulla.
                                const modificabile = o.stato === 'bozza';
                                const eliminabile = o.stato === 'bozza' || o.stato === 'annullato';

                                return (
                                    <tr key={o.id} className={ritardo ? 'row--alert' : undefined}>
                                        <td>
                                            <div
                                                className="client-name-cell"
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => onView(o.id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        onView(o.id);
                                                    }
                                                }}
                                            >
                                                <span className="client-name-text">{o.numero}</span>
                                            </div>
                                        </td>
                                        <td>{o.cliente || '—'}</td>
                                        <td>{formatDate(o.data)}</td>
                                        <td>
                                            {o.consegna ? formatDate(o.consegna) : '—'}
                                            {ritardo && (
                                                <span className="ritardo-tag" title="Consegna scaduta con ordine ancora aperto">
                                                    <i className="fa-solid fa-clock-rotate-left" /> in ritardo
                                                </span>
                                            )}
                                        </td>
                                        <td>{totali.pezzi.toLocaleString('it-IT')}</td>
                                        <td style={{ fontWeight: 600 }}>{formatEuro(totali.totale)}</td>
                                        <td>
                                            <span className={`priorita-tag priorita-tag--${o.priorita}`}>
                                                {PRIORITA_LABEL[o.priorita]}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge status-badge--${o.stato}`}>
                                                {STATO_ORDINE_LABEL[o.stato]}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button
                                                    type="button"
                                                    className="neu-icon-btn neu-icon-btn--sm"
                                                    title="Dettaglio"
                                                    aria-label={`Dettaglio ordine ${o.numero}`}
                                                    onClick={(e) => { e.stopPropagation(); onView(o.id); }}
                                                >
                                                    <i className="fa-solid fa-eye" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="neu-icon-btn neu-icon-btn--sm"
                                                    disabled={!modificabile}
                                                    title={modificabile ? 'Modifica' : 'Solo le bozze sono modificabili'}
                                                    aria-label={`Modifica ordine ${o.numero}`}
                                                    onClick={(e) => { e.stopPropagation(); onEdit(o.id); }}
                                                >
                                                    <i className="fa-solid fa-pen" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="neu-icon-btn neu-icon-btn--sm"
                                                    disabled={!eliminabile}
                                                    title={eliminabile ? 'Elimina' : 'Un ordine confermato resta agli atti'}
                                                    aria-label={`Elimina ordine ${o.numero}`}
                                                    onClick={(e) => { e.stopPropagation(); onDelete(o.id); }}
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

export type { SortKey };
