import { CATEGORIE } from '../../types/prodotto';
import type { FornitoreStato } from '../../types/fornitore';

export type Filter = 'all' | FornitoreStato;
export type CategoriaFilter = 'all' | (typeof CATEGORIE)[number];

interface FornitoreToolbarProps {
    search: string;
    onSearchChange: (v: string) => void;
    filter: Filter;
    onFilterChange: (f: Filter) => void;
    categoria: CategoriaFilter;
    onCategoriaChange: (c: CategoriaFilter) => void;
    onExport: () => void;
    onAdd: () => void;
}

const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Tutti' },
    { key: 'attivo', label: 'Attivi' },
    { key: 'sospeso', label: 'Sospesi' },
    { key: 'inattivo', label: 'Inattivi' },
];

/** Toolbar ricerca/filtri/export — stessa struttura di ClientToolbar e ProductToolbar. */
export function FornitoreToolbar({
    search, onSearchChange, filter, onFilterChange,
    categoria, onCategoriaChange, onExport, onAdd,
}: FornitoreToolbarProps) {
    return (
        <section className="toolbar-row">
            <div className="toolbar-left">
                <div className="search-box search-box--table">
                    <i className="fa-solid fa-magnifying-glass" />
                    <input
                        type="text"
                        placeholder="Cerca per nome, email o città..."
                        autoComplete="off"
                        aria-label="Cerca fornitore"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    {FILTERS.map((f) => (
                        <button
                            key={f.key}
                            type="button"
                            className={`chip-btn${filter === f.key ? ' active' : ''}`}
                            aria-pressed={filter === f.key}
                            onClick={() => onFilterChange(f.key)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="select-box select-box--toolbar">
                    <select
                        value={categoria}
                        aria-label="Filtra per categoria fornita"
                        onChange={(e) => onCategoriaChange(e.target.value as CategoriaFilter)}
                    >
                        <option value="all">Tutte le categorie</option>
                        {CATEGORIE.map((c) => (
                            <option value={c} key={c}>{c}</option>
                        ))}
                    </select>
                    <i className="fa-solid fa-chevron-down" />
                </div>
            </div>

            <div className="toolbar-right">
                <button type="button" className="neu-icon-btn" onClick={onExport} aria-label="Esporta CSV" title="Esporta CSV">
                    <i className="fa-solid fa-file-export" />
                </button>
                <button type="button" className="neu-action-btn" onClick={onAdd}>
                    <i className="fa-solid fa-plus" />
                    <span>Nuovo Fornitore</span>
                </button>
            </div>
        </section>
    );
}
