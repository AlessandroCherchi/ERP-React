import { useState } from 'react';
import { SettingsCard } from './SettingsCard';
import { useDraft } from '../../hooks/useDraft';
import { OptionListEditor, type EditorColumn } from './OptionListEditor';
import { validateOptions } from '../../lib/options';
import { useToast } from '../ui/toastContext';
import { useConfig, useConfigStore } from '../../config/configStore';
import type { TenantConfig } from '../../config/types';
import { useT, type TKey } from '../../i18n';

type TableKey = keyof TenantConfig['tables'];
type Row = { value: string | number; label: string; icon?: string; natura?: string };

const TABLES: { key: TableKey; label: TKey }[] = [
    { key: 'categorie', label: 'settings.tables.categorie' },
    { key: 'unita', label: 'settings.tables.unita' },
    { key: 'aliquoteIva', label: 'settings.tables.aliquoteIva' },
    { key: 'terminiPagamento', label: 'settings.tables.terminiPagamento' },
    { key: 'metodiPagamento', label: 'settings.tables.metodiPagamento' },
];

/** Editor della singola tabella: bozza, validazione, salvataggio. */
function TableEditor({ table, canEdit }: { table: TableKey; canEdit: boolean }) {
    const t = useT();
    const { toast } = useToast();
    const config = useConfig();
    const update = useConfigStore((s) => s.updateConfig);
    const { draft, setDraft, dirty } = useDraft<Row[]>(config.tables[table] as Row[]);

    const columns: EditorColumn<Row>[] = [
        { key: 'value', header: t('settings.tables.value'), type: table === 'aliquoteIva' ? 'number' : 'text' },
        { key: 'label', header: t('settings.tables.label'), width: 3 },
        ...(table === 'categorie' ? [{ key: 'icon' as const, header: t('settings.tables.icon'), placeholder: 'fa-box', width: 1.4 }] : []),
        ...(table === 'aliquoteIva' ? [{ key: 'natura' as const, header: t('settings.tables.natura'), placeholder: 'N3.1' }] : []),
    ];

    const errors = validateOptions(draft, { empty: t('settings.tables.empty'), duplicate: t('settings.tables.duplicate') });
    if (table === 'aliquoteIva') {
        draft.forEach((r, i) => {
            const n = Number(r.value);
            if (!errors[i] && (!Number.isFinite(n) || n < 0 || n > 100)) errors[i] = '0–100';
        });
    }
    const invalid = Object.keys(errors).length > 0 || draft.length === 0;

    function save() {
        // Pulizia: niente campi opzionali vuoti salvati nel config.
        const rows = draft.map(({ icon, natura, ...r }) => ({
            ...r,
            label: r.label.trim(),
            ...(table === 'aliquoteIva' ? { value: Number(r.value) } : { value: String(r.value).trim() }),
            ...(icon ? { icon: icon.trim() } : {}),
            ...(natura ? { natura: natura.trim() } : {}),
        }));
        update({ tables: { ...config.tables, [table]: rows } });
        toast(t('settings.saved'), 'success');
    }

    return (
        <SettingsCard title={t(TABLES.find((x) => x.key === table)!.label)} canEdit={canEdit} dirty={dirty} invalid={invalid} onSave={save}>
            <OptionListEditor
                rows={draft}
                columns={columns}
                onChange={setDraft}
                errors={errors}
                blank={() => ({ value: table === 'aliquoteIva' ? 0 : '', label: '' })}
                footer={draft.length === 0 && <span className="form-error">{t('settings.tables.atLeastOne')}</span>}
            />
        </SettingsCard>
    );
}

/** Tabelle di dominio del tenant (categorie, unità, IVA, pagamenti). */
export function TablesSettings({ canEdit }: { canEdit: boolean }) {
    const t = useT();
    const [active, setActive] = useState<TableKey>('categorie');
    return (
        <>
            <div className="filter-group settings-subtabs" role="tablist">
                {TABLES.map((x) => (
                    <button key={x.key} type="button" role="tab" aria-selected={active === x.key} className={`chip-btn${active === x.key ? ' active' : ''}`} onClick={() => setActive(x.key)}>
                        {t(x.label)}
                    </button>
                ))}
            </div>
            {/* key: cambiando tabella la bozza riparte dalla tabella selezionata */}
            <TableEditor key={active} table={active} canEdit={canEdit} />
        </>
    );
}
