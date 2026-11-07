import type { ReactNode } from 'react';
import { useT } from '../../i18n';

export interface ChipOption<V extends string> {
    value: V;
    label: string;
}

interface ListToolbarProps<V extends string> {
    /** Assenti = nessun campo di ricerca (elenchi brevi). */
    search?: string;
    onSearchChange?: (v: string) => void;
    searchPlaceholder?: string;
    /** Filtro rapido a chip (es. stato). */
    chips?: { value: V; options: ChipOption<V>[]; onChange: (v: V) => void; label: string };
    /** Filtri aggiuntivi (select, toggle) a destra delle chip. */
    children?: ReactNode;
    onExport?: () => void;
    /** Assente = utente senza permesso di creazione: il pulsante non compare. */
    onAdd?: () => void;
    addLabel?: string;
}

/** Barra sopra le tabelle elenco: ricerca, filtri, export, nuovo. */
export function ListToolbar<V extends string>({
    search, onSearchChange, searchPlaceholder, chips, children, onExport, onAdd, addLabel,
}: ListToolbarProps<V>) {
    const t = useT();
    return (
        <section className="toolbar-row">
            <div className="toolbar-left">
                {onSearchChange && (
                    <div className="search-box search-box--table">
                        <i className="fa-solid fa-magnifying-glass" />
                        <input
                            type="search"
                            placeholder={searchPlaceholder}
                            aria-label={searchPlaceholder ?? t('common.search')}
                            autoComplete="off"
                            value={search ?? ''}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>
                )}

                {chips && (
                    <div className="filter-group" role="group" aria-label={chips.label}>
                        {chips.options.map((o) => (
                            <button
                                key={o.value}
                                type="button"
                                className={`chip-btn${chips.value === o.value ? ' active' : ''}`}
                                aria-pressed={chips.value === o.value}
                                onClick={() => chips.onChange(o.value)}
                            >
                                {o.label}
                            </button>
                        ))}
                    </div>
                )}

                {children}
            </div>
            <div className="toolbar-right">
                {onExport && (
                    <button type="button" className="neu-icon-btn" onClick={onExport} aria-label={t('table.export')} title={t('table.export')}>
                        <i className="fa-solid fa-file-export" />
                    </button>
                )}
                {onAdd && (
                    <button type="button" className="neu-action-btn" onClick={onAdd}>
                        <i className="fa-solid fa-plus" />
                        <span>{addLabel}</span>
                    </button>
                )}
            </div>
        </section>
    );
}

/** Select di filtro con lo stile della toolbar. */
export function ToolbarSelect<V extends string>({ value, onChange, options, label }: {
    value: V;
    onChange: (v: V) => void;
    options: ChipOption<V>[];
    label: string;
}) {
    return (
        <div className="select-box select-box--toolbar">
            <select value={value} aria-label={label} onChange={(e) => onChange(e.target.value as V)}>
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <i className="fa-solid fa-chevron-down" />
        </div>
    );
}
