import { SettingsCard } from './SettingsCard';
import { useDraft } from '../../hooks/useDraft';
import { FormGroup, InputBox } from '../ui/FormField';
import { useToast } from '../ui/toastContext';
import { useConfig, useConfigStore } from '../../config/configStore';
import { formatNumber } from '../../config/numbering';
import type { NumberingRule, TenantConfig } from '../../config/types';
import { useT, type TKey } from '../../i18n';

type RuleKey = keyof TenantConfig['numbering'];
const RULES: { key: RuleKey; label: TKey; icon: string }[] = [
    { key: 'sku', label: 'settings.numbering.sku', icon: 'fa-barcode' },
    { key: 'ordine', label: 'settings.numbering.ordine', icon: 'fa-cart-shopping' },
    { key: 'fattura', label: 'settings.numbering.fattura', icon: 'fa-file-invoice' },
];

const valid = (r: NumberingRule) => r.prefix.length <= 10 && Number.isInteger(r.start) && r.start >= 0 && r.pad >= 0 && r.pad <= 10;

/** Regole di numerazione con anteprima del prossimo codice. */
export function NumberingSettings({ canEdit }: { canEdit: boolean }) {
    const t = useT();
    const { toast } = useToast();
    const config = useConfig();
    const update = useConfigStore((s) => s.updateConfig);
    const resetSection = useConfigStore((s) => s.resetSection);
    const { draft, setDraft, dirty } = useDraft(config.numbering);

    const set = (key: RuleKey, patch: Partial<NumberingRule>) => setDraft((d) => ({ ...d, [key]: { ...d[key], ...patch } }));
    const invalid = RULES.some((r) => !valid(draft[r.key]));

    function save() {
        update({ numbering: draft });
        toast(t('settings.saved'), 'success');
    }

    return (
        <SettingsCard title={t('settings.tabs.numerazioni')} description={t('settings.numbering.hint')} canEdit={canEdit} dirty={dirty} invalid={invalid} onSave={save} onReset={() => resetSection('numbering')}>
            <div className="numbering-grid">
                {RULES.map(({ key, label, icon }) => {
                    const rule = draft[key];
                    return (
                        <fieldset key={key} className="numbering-rule">
                            <legend><i className={`fa-solid ${icon}`} /> {t(label)}</legend>
                            <FormGroup label={t('settings.numbering.prefix')}>
                                <InputBox icon="fa-font" value={rule.prefix} maxLength={10} onChange={(e) => set(key, { prefix: e.target.value })} />
                            </FormGroup>
                            <FormGroup label={t('settings.numbering.start')}>
                                <InputBox icon="fa-hashtag" type="number" min={0} value={rule.start} onChange={(e) => set(key, { start: Math.max(0, Math.trunc(Number(e.target.value) || 0)) })} />
                            </FormGroup>
                            <FormGroup label={t('settings.numbering.pad')}>
                                <InputBox icon="fa-ruler-horizontal" type="number" min={0} max={10} value={rule.pad} onChange={(e) => set(key, { pad: Math.min(10, Math.max(0, Math.trunc(Number(e.target.value) || 0))) })} />
                            </FormGroup>
                            <p className="numbering-preview">{t('settings.numbering.next')}: <strong>{formatNumber(rule, rule.start + 1)}</strong></p>
                        </fieldset>
                    );
                })}
            </div>
        </SettingsCard>
    );
}
