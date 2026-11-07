import { PRIORITA_OPTIONS, type OrdinePriorita, type StatoFilter } from '../../types/ordine';

export type PrioritaFilter = 'all' | OrdinePriorita;
export type { StatoFilter };

interface OrdineToolbarProps {
    search: string;
    onSearchChange: (v: string) => void;
    stato: StatoFilter;
    onStatoChange: (s: StatoFilter) => void;
    priorita: PrioritaFilter;
    onPrioritaChange: (p: PrioritaFilter) => void;
    soloRitardo: boolean;
    onSoloRitardoChange: (v: boolean) => void;
    onExport: () => void;
    onAdd: () => void;
}

const FILTERS: { key: StatoFilter; label: string }[] = [
    { key: 'all', label: 'Tutti' },
    { key: 'bozza', label: 'Bozze' },
    { key: 'in-corso', label: 'In corso' },
    { key: 'consegnato', label: 'Consegnati' },
    { key: 'annullato', label: 'Annullati' },
];

/** Toolbar ricerca/filtri/export — stessa struttura di ClientToolbar e FornitoreToolbar. */
export function OrdineToolbar({
    search, onSearchChange, stato, onStatoChange, priorita, onPrioritaChange,
    soloRitardo, onSoloRitardoChange, onExport, onAdd,
}: OrdineToolbarProps) {
    return (
        <section className="toolbar-row">
            <div className="toolbar-left">
                <div className="search-box search-box--table">
                    <i className="fa-solid fa-magnifying-glass" />
                    <input
                        type="text"
                        placeholder="Cerca per numero, cliente o articolo..."
                        autoComplete="off"
                        aria-label="Cerca ordine"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    {FILTERS.map((f) => (
                        <button
                            key={f.key}
                            type="button"
                            className={`chip-btn${stato === f.key ? ' active' : ''}`}
                            aria-pressed={stato === f.key}
                            onClick={() => onStatoChange(f.key)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="select-box select-box--toolbar">
                    <select
                        value={priorita}
                        aria-label="Filtra per priorità"
                        onChange={(e) => onPrioritaChange(e.target.value as PrioritaFilter)}
                    >
                        <option value="all">Tutte le priorità</option>
                        {PRIORITA_OPTIONS.map((p) => (
                            <option value={p.value} key={p.value}>{p.label}</option>
                        ))}
                    </select>
                    <i className="fa-solid fa-chevron-down" />
                </div>

                {/* Il ritardo è un asse indipendente dallo stato: un ordine può
                    essere "in corso" e in ritardo insieme, quindi è un
                    interruttore a sé e non un'altra chip del gruppo. */}
                <button
                    type="button"
                    className={`chip-btn chip-btn--toggle${soloRitardo ? ' active' : ''}`}
                    aria-pressed={soloRitardo}
                    onClick={() => onSoloRitardoChange(!soloRitardo)}
                >
                    <i className="fa-solid fa-clock-rotate-left" /> Solo in ritardo
                </button>
            </div>

            <div className="toolbar-right">
                <button type="button" className="neu-icon-btn" onClick={onExport} aria-label="Esporta CSV" title="Esporta CSV">
                    <i className="fa-solid fa-file-export" />
                </button>
                <button type="button" className="neu-action-btn" onClick={onAdd}>
                    <i className="fa-solid fa-plus" />
                    <span>Nuovo Ordine</span>
                </button>
            </div>
        </section>
    );
}
