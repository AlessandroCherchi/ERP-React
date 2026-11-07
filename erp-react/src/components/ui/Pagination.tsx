interface PaginationProps {
    /** Totale righe filtrate (non solo quelle della pagina). */
    total: number;
    currentPage: number;
    totalPages: number;
    perPage: number;
    onPageChange: (page: number) => void;
}

/**
 * Barra di paginazione delle tabelle elenco.
 * Markup identico a quello originale di clienti.html: estratto qui perché
 * Clienti, Inventario e Fornitori lo ripetevano parola per parola.
 */
export function Pagination({ total, currentPage, totalPages, perPage, onPageChange }: PaginationProps) {
    const start = Math.min((currentPage - 1) * perPage + 1, total);
    const end = Math.min(currentPage * perPage, total);

    return (
        <div className="pagination">
            <span className="pagination-info">Mostrando {start}-{end} di {total}</span>
            <div className="pagination-controls">
                <button
                    type="button"
                    className="neu-icon-btn neu-icon-btn--sm"
                    aria-label="Pagina precedente"
                    disabled={currentPage <= 1}
                    onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                >
                    <i className="fa-solid fa-chevron-left" />
                </button>
                <div className="pagination-pages">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                            type="button"
                            key={p}
                            className={`page-btn${p === currentPage ? ' active' : ''}`}
                            aria-current={p === currentPage ? 'page' : undefined}
                            onClick={() => onPageChange(p)}
                        >
                            {p}
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    className="neu-icon-btn neu-icon-btn--sm"
                    aria-label="Pagina successiva"
                    disabled={currentPage >= totalPages}
                    onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                >
                    <i className="fa-solid fa-chevron-right" />
                </button>
            </div>
        </div>
    );
}
