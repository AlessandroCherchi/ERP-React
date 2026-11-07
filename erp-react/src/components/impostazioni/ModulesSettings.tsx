import { SettingsCard } from './SettingsCard';
import { useToast } from '../ui/toastContext';
import { useConfig, useConfigStore, isModuleEnabled } from '../../config/configStore';
import { MODULES } from '../../app/modules';
import type { ModuleId } from '../../app/moduleIds';
import { useT } from '../../i18n';

/** Moduli che non si possono spegnere: senza, il prodotto non è amministrabile. */
const LOCKED: ModuleId[] = ['dashboard', 'impostazioni'];

/** Attivazione dei moduli per il tenant: effetto immediato su menu e route. */
export function ModulesSettings({ canEdit }: { canEdit: boolean }) {
    const t = useT();
    const { toast } = useToast();
    const config = useConfig();
    const update = useConfigStore((s) => s.updateConfig);

    function toggle(id: ModuleId, on: boolean) {
        update({ modules: { ...config.modules, [id]: on } });
        toast(t('settings.saved'), 'success');
    }

    return (
        <SettingsCard title={t('settings.tabs.moduli')} description={t('settings.modules.intro')} canEdit={canEdit}>
            <ul className="module-list">
                {MODULES.map((m) => {
                    const locked = LOCKED.includes(m.id);
                    const on = isModuleEnabled(config, m.id);
                    return (
                        <li key={m.id} className="module-item">
                            <i className={`fa-solid ${m.icon}`} aria-hidden="true" />
                            <span className="module-name">
                                {t(m.labelKey)}
                                {!m.page && <em className="nav-badge">{t('nav.soon')}</em>}
                            </span>
                            {locked ? (
                                <span className="module-locked">{t('settings.modules.locked')}</span>
                            ) : (
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={on}
                                    aria-label={t(m.labelKey)}
                                    className={`switch-toggle${on ? ' on' : ''}`}
                                    onClick={() => toggle(m.id, !on)}
                                />
                            )}
                        </li>
                    );
                })}
            </ul>
        </SettingsCard>
    );
}
