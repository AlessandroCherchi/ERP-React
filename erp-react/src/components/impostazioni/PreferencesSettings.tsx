import { useMemo } from 'react';
import { SettingsCard } from './SettingsCard';
import { useDraft } from '../../hooks/useDraft';
import { FormGroup, FormRow, InputBox, SelectBox } from '../ui/FormField';
import { useToast } from '../ui/toastContext';
import { useConfig, useConfigStore } from '../../config/configStore';
import { formatEuro } from '../../lib/format';
import { DICTIONARIES, useT, type Language } from '../../i18n';

const LANGUAGES: Record<Language, string> = { it: 'Italiano', en: 'English' };
const LOCALES = ['it-IT', 'en-GB', 'en-US', 'de-DE', 'fr-FR', 'es-ES'];
const CURRENCIES = ['EUR', 'CHF', 'GBP', 'USD'];

/** Lingua, formati regionali, valuta, densità delle tabelle. */
export function PreferencesSettings({ canEdit }: { canEdit: boolean }) {
    const t = useT();
    const { toast } = useToast();
    const config = useConfig();
    const update = useConfigStore((s) => s.updateConfig);
    const resetSection = useConfigStore((s) => s.resetSection);

    const source = useMemo(() => ({ ...config.locale, pageSize: config.pageSize }), [config.locale, config.pageSize]);
    const { draft, setDraft, dirty } = useDraft(source);

    const sample = useMemo(() => {
        try {
            const n = (1234567.891).toLocaleString(draft.intl, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const d = new Date(2026, 11, 31).toLocaleDateString(draft.intl);
            return `${n} · ${d}`;
        } catch {
            return '';
        }
    }, [draft.intl]);

    function save() {
        const { pageSize, ...locale } = draft;
        update({ locale, pageSize });
        toast(t('settings.saved'), 'success');
    }

    return (
        <SettingsCard
            title={t('settings.tabs.preferenze')}
            canEdit={canEdit}
            dirty={dirty}
            onSave={save}
            onReset={() => { resetSection('locale'); resetSection('pageSize'); }}
        >
            <FormRow>
                <FormGroup label={t('settings.prefs.language')}>
                    <SelectBox value={draft.language} onChange={(e) => setDraft((d) => ({ ...d, language: e.target.value as Language }))}>
                        {(Object.keys(DICTIONARIES) as Language[]).map((l) => <option key={l} value={l}>{LANGUAGES[l]}</option>)}
                    </SelectBox>
                </FormGroup>
                <FormGroup label={t('settings.prefs.intl')}>
                    <SelectBox value={draft.intl} onChange={(e) => setDraft((d) => ({ ...d, intl: e.target.value }))}>
                        {LOCALES.map((l) => <option key={l} value={l}>{l}</option>)}
                    </SelectBox>
                    <small className="field-hint">{sample}</small>
                </FormGroup>
            </FormRow>
            <FormRow>
                <FormGroup label={t('settings.prefs.currency')}>
                    <SelectBox value={draft.currency} onChange={(e) => setDraft((d) => ({ ...d, currency: e.target.value }))}>
                        {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </SelectBox>
                    <small className="field-hint">{formatEuro(1250)}</small>
                </FormGroup>
                <FormGroup label={t('settings.prefs.pageSize')}>
                    <InputBox icon="fa-list-ol" type="number" min={5} max={100} value={draft.pageSize} onChange={(e) => setDraft((d) => ({ ...d, pageSize: Math.min(100, Math.max(5, Number(e.target.value) || 10)) }))} />
                </FormGroup>
            </FormRow>
        </SettingsCard>
    );
}
