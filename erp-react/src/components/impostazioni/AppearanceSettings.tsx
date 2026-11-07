import { useMemo, type CSSProperties } from 'react';
import { SettingsCard } from './SettingsCard';
import { useDraft } from '../../hooks/useDraft';
import { FormGroup, FormRow, InputBox } from '../ui/FormField';
import { useToast } from '../ui/toastContext';
import { useConfig, useConfigStore } from '../../config/configStore';
import { derivePalette, isHexColor } from '../../config/palette';
import { readToken, resolveThemeVars } from '../../config/theme';
import { useT } from '../../i18n';

/** Campo colore: picker nativo + testo hex sincronizzati. */
function ColorField({ label, value, onChange, error }: { label: string; value: string; onChange: (v: string) => void; error?: string }) {
    return (
        <FormGroup label={label} error={error}>
            <div className="color-field">
                <input type="color" value={isHexColor(value) ? value : '#000000'} onChange={(e) => onChange(e.target.value)} aria-label={label} />
                <InputBox icon="fa-palette" value={value} onChange={(e) => onChange(e.target.value.trim())} maxLength={7} />
            </div>
        </FormGroup>
    );
}

/**
 * Colori di brand e forma. Si scelgono due colori: le varianti (chiaro,
 * scuro, ombre) le calcola derivePalette, e l'anteprima mostra il risultato
 * sui componenti reali prima del salvataggio.
 */
export function AppearanceSettings({ canEdit }: { canEdit: boolean }) {
    const t = useT();
    const { toast } = useToast();
    const config = useConfig();
    const update = useConfigStore((s) => s.updateConfig);
    const resetSection = useConfigStore((s) => s.resetSection);

    const source = useMemo(() => ({
        primary: config.theme['--erp-accent'] ?? readToken('--erp-accent', '#a10f0f'),
        secondary: config.theme['--erp-gold-strong'] ?? readToken('--erp-gold-strong', '#d4a017'),
        radius: Number.parseInt(config.theme['--erp-radius'] ?? '12', 10),
    }), [config.theme]);
    const { draft, setDraft, dirty } = useDraft(source);

    const primaryOk = isHexColor(draft.primary);
    const secondaryOk = isHexColor(draft.secondary);
    const preview = primaryOk && secondaryOk ? derivePalette(draft.primary, draft.secondary) : {};
    // Le custom property composte (gradienti, -rgb) sono calcolate su :root:
    // nell'anteprima vanno ridefinite insieme ai colori base.
    const previewStyle = {
        ...resolveThemeVars(preview),
        ...(preview['--erp-accent-light'] && { '--erp-accent-gradient': `linear-gradient(155deg, ${preview['--erp-accent-light']}, ${preview['--erp-accent-dark']})` }),
        '--erp-radius': `${draft.radius}px`,
    } as CSSProperties;

    function save() {
        update({ theme: { ...derivePalette(draft.primary, draft.secondary), '--erp-radius': `${draft.radius}px` } });
        toast(t('settings.saved'), 'success');
    }

    return (
        <SettingsCard
            title={t('settings.tabs.aspetto')}
            canEdit={canEdit}
            dirty={dirty}
            invalid={!primaryOk || !secondaryOk}
            onSave={save}
            onReset={() => resetSection('theme')}
        >
            <FormRow>
                <ColorField label={t('settings.appearance.primary')} value={draft.primary} onChange={(primary) => setDraft((d) => ({ ...d, primary }))} error={primaryOk ? undefined : t('settings.appearance.invalidColor')} />
                <ColorField label={t('settings.appearance.secondary')} value={draft.secondary} onChange={(secondary) => setDraft((d) => ({ ...d, secondary }))} error={secondaryOk ? undefined : t('settings.appearance.invalidColor')} />
            </FormRow>
            <FormRow>
                <FormGroup label={t('settings.appearance.radius')}>
                    <InputBox icon="fa-vector-square" type="number" min={0} max={24} value={draft.radius} onChange={(e) => setDraft((d) => ({ ...d, radius: Math.min(24, Math.max(0, Number(e.target.value) || 0)) }))} />
                </FormGroup>
                <FormGroup label={t('settings.appearance.preview')}>
                    {/* Le variabili della bozza valgono solo dentro l'anteprima. */}
                    <div className="theme-preview" style={previewStyle}>
                        <button type="button" className="neu-action-btn" tabIndex={-1}><i className="fa-solid fa-check" /> {t('settings.appearance.previewButton')}</button>
                        <span className="chip-btn active">{t('settings.appearance.previewBadge')}</span>
                        <span className="theme-swatch" style={{ background: 'var(--erp-accent-gradient)' }} />
                        <span className="theme-swatch" style={{ background: 'var(--erp-gold-strong)' }} />
                    </div>
                </FormGroup>
            </FormRow>
        </SettingsCard>
    );
}
