import { useMemo, type ChangeEvent } from 'react';
import * as v from 'valibot';
import { SettingsCard } from './SettingsCard';
import { useDraft } from '../../hooks/useDraft';
import { FormGroup, FormRow, InputBox } from '../ui/FormField';
import { ActionButton } from '../ui/Button';
import { useToast } from '../ui/toastContext';
import { useConfig, useConfigStore } from '../../config/configStore';
import { useT } from '../../i18n';
import defaultLogo from '../../assets/img/logo.png';

const MAX_LOGO_BYTES = 200 * 1024;

/** P.IVA italiana opzionalmente con prefisso paese (validazione di forma, non di checksum). */
const schema = v.object({
    name: v.pipe(v.string(), v.trim(), v.minLength(1)),
    ragioneSociale: v.pipe(v.string(), v.trim(), v.minLength(1)),
    piva: v.pipe(v.string(), v.regex(/^([A-Z]{2})?[0-9A-Z]{8,12}$/)),
    email: v.union([v.literal(''), v.pipe(v.string(), v.email())]),
});

/** Brand e anagrafica dell'azienda che usa il gestionale. */
export function CompanySettings({ canEdit }: { canEdit: boolean }) {
    const t = useT();
    const { toast } = useToast();
    const config = useConfig();
    const update = useConfigStore((s) => s.updateConfig);
    const resetSection = useConfigStore((s) => s.resetSection);

    const source = useMemo(() => ({ ...config.company, name: config.brand.name, logo: config.brand.logo }), [config.company, config.brand]);
    const { draft, setDraft, dirty } = useDraft(source);
    const set = <K extends keyof typeof draft>(k: K, val: (typeof draft)[K]) => setDraft((d) => ({ ...d, [k]: val }));

    const issues = v.safeParse(schema, draft).issues ?? [];
    const errorOf = (field: string) => (issues.some((i) => i.path?.[0]?.key === field) ? t('settings.tables.empty') : undefined);

    function onLogo(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (file.size > MAX_LOGO_BYTES) {
            toast(t('settings.company.logoTooBig'), 'error');
            return;
        }
        // Data URL: il logo viaggia con il config, senza un servizio di upload.
        // TODO(step Backend): storage oggetti (Supabase Storage) + URL firmato.
        const reader = new FileReader();
        reader.onload = () => set('logo', String(reader.result));
        reader.readAsDataURL(file);
    }

    function save() {
        const { name, logo, ...company } = draft;
        update({ brand: { name: name.trim(), logo }, company });
        toast(t('settings.saved'), 'success');
    }

    function reset() {
        resetSection('brand');
        resetSection('company');
    }

    return (
        <SettingsCard title={t('settings.tabs.azienda')} canEdit={canEdit} dirty={dirty} invalid={issues.length > 0} onSave={save} onReset={reset}>
            <FormRow>
                <FormGroup label={t('settings.company.brandName')} error={errorOf('name')}>
                    <InputBox icon="fa-signature" value={draft.name} onChange={(e) => set('name', e.target.value)} />
                </FormGroup>
                <FormGroup label={t('settings.company.logo')}>
                    <div className="logo-field">
                        <img src={draft.logo || defaultLogo} alt="" className="logo-preview" />
                        <label className="neu-action-btn neu-action-btn--outline logo-upload">
                            <i className="fa-solid fa-upload" /> {t('settings.company.logoUpload')}
                            <input type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" onChange={onLogo} hidden />
                        </label>
                        {draft.logo && <ActionButton variant="outline" onClick={() => set('logo', '')}>{t('settings.company.logoRemove')}</ActionButton>}
                    </div>
                    <small className="field-hint">{t('settings.company.logoHint')}</small>
                </FormGroup>
            </FormRow>
            <FormRow>
                <FormGroup label={t('settings.company.ragioneSociale')} error={errorOf('ragioneSociale')}>
                    <InputBox icon="fa-building" value={draft.ragioneSociale} onChange={(e) => set('ragioneSociale', e.target.value)} />
                </FormGroup>
                <FormGroup label={t('settings.company.piva')} error={errorOf('piva') && 'IT + 11 cifre'}>
                    <InputBox icon="fa-id-card" value={draft.piva} onChange={(e) => set('piva', e.target.value.toUpperCase().replace(/\s/g, ''))} />
                </FormGroup>
            </FormRow>
            <FormRow>
                <FormGroup label={t('settings.company.indirizzo')}>
                    <InputBox icon="fa-location-dot" value={draft.indirizzo} onChange={(e) => set('indirizzo', e.target.value)} />
                </FormGroup>
                <FormGroup label={t('settings.company.email')} error={errorOf('email') && 'Email non valida'}>
                    <InputBox icon="fa-envelope" type="email" value={draft.email} onChange={(e) => set('email', e.target.value)} />
                </FormGroup>
            </FormRow>
        </SettingsCard>
    );
}
