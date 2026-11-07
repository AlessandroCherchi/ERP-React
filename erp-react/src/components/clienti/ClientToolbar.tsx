import type { ClienteStato } from '../../types/cliente';

type Filter = 'all' | ClienteStato;

interface ClientToolbarProps {
    search: string;
    onSearchChange: (v: string) => void;
    filter: Filter;
    onFilterChange: (f: Filter) => void;
    onExport: () => void;
    onAdd: () => void;
}

const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Tutti' },
    { key: 'attivo', label: 'Attivi' },
    { key: 'inattivo', label: 'Inattivi' },
    { key: 'prospect', label: 'Prospect' },
];

/** Toolbar ricerca/filtri/export — porting 1:1 di clienti.html #clientiToolbar. */
export function ClientToolbar({ search, onSearchChange, filter, onFilterChange, onExport, onAdd }: ClientToolbarProps) {
    return (
        <section className="toolbar-row">
            <div className="toolbar-left">
                <div className="search-box search-box--table">
                    <i className="fa-solid fa-magnifying-glass" />
                    <input
                        type="text"
                        placeholder="Cerca cliente..."
                        autoComplete="off"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    {FILTERS.map((f) => (
                        <button
                            key={f.key}
                            className={`chip-btn${filter === f.key ? ' active' : ''}`}
                            onClick={() => onFilterChange(f.key)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="toolbar-right">
                <button className="neu-icon-btn" onClick={onExport} aria-label="Esporta CSV" title="Esporta CSV">
                    <i className="fa-solid fa-file-export" />
                </button>
                <button className="neu-action-btn" onClick={onAdd}>
                    <i className="fa-solid fa-plus" />
                    <span>Nuovo Cliente</span>
                </button>
            </div>
        </section>
    );
}

export type { Filter };
