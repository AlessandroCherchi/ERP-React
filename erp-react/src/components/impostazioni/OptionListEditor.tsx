import type { ReactNode } from 'react';
import { useT } from '../../i18n';

/** Colonna editabile di una tabella di dominio. */
export interface EditorColumn<R> {
    key: keyof R & string;
    header: string;
    /** Larghezza relativa (fr). */
    width?: number;
    type?: 'text' | 'number';
    placeholder?: string;
}

interface OptionListEditorProps<R extends { value: string | number }> {
    rows: R[];
    columns: EditorColumn<R>[];
    onChange: (rows: R[]) => void;
    /** Riga vuota da aggiungere. */
    blank: () => R;
    /** Errori per indice di riga. */
    errors?: Record<number, string>;
    footer?: ReactNode;
}

/**
 * Editor generico di liste chiave/valore (categorie, unità, aliquote, …):
 * aggiunta, modifica in linea, rimozione. La validazione (unicità, campi
 * obbligatori) la decide il chiamante, che passa gli errori per riga.
 */
export function OptionListEditor<R extends { value: string | number }>({ rows, columns, onChange, blank, errors = {}, footer }: OptionListEditorProps<R>) {
    const t = useT();
    const template = `${columns.map((c) => `${c.width ?? 1}fr`).join(' ')} 44px`;

    function setCell(index: number, key: keyof R, raw: string, type: EditorColumn<R>['type']) {
        const value = type === 'number' ? (raw === '' ? '' : Number(raw)) : raw;
        onChange(rows.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
    }

    return (
        <div className="option-editor" role="table">
            <div className="option-row option-row--head" role="row" style={{ gridTemplateColumns: template }}>
                {columns.map((c) => <span key={c.key} role="columnheader">{c.header}</span>)}
                <span />
            </div>
            {rows.map((row, i) => (
                <div key={i} role="row" className={`option-row${errors[i] ? ' has-error' : ''}`} style={{ gridTemplateColumns: template }}>
                    {columns.map((c) => (
                        <input
                            key={c.key}
                            role="cell"
                            className="option-input"
                            type={c.type ?? 'text'}
                            aria-label={`${c.header} ${i + 1}`}
                            placeholder={c.placeholder}
                            value={String(row[c.key] ?? '')}
                            onChange={(e) => setCell(i, c.key, e.target.value, c.type)}
                        />
                    ))}
                    <button
                        type="button"
                        className="neu-icon-btn neu-icon-btn--sm"
                        aria-label={`${t('settings.tables.remove')} ${i + 1}`}
                        onClick={() => onChange(rows.filter((_, j) => j !== i))}
                    >
                        <i className="fa-solid fa-trash-can" />
                    </button>
                    {errors[i] && <span className="form-error option-error">{errors[i]}</span>}
                </div>
            ))}
            <div className="option-editor-footer">
                <button type="button" className="chip-btn" onClick={() => onChange([...rows, blank()])}>
                    <i className="fa-solid fa-plus" /> {t('settings.tables.add')}
                </button>
                {footer}
            </div>
        </div>
    );
}
