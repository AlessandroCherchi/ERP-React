import { useSearchParams } from 'react-router-dom';
import type { ComponentType } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Topbar } from '../components/layout/Topbar';
import { CompanySettings } from '../components/impostazioni/CompanySettings';
import { AppearanceSettings } from '../components/impostazioni/AppearanceSettings';
import { ModulesSettings } from '../components/impostazioni/ModulesSettings';
import { TablesSettings } from '../components/impostazioni/TablesSettings';
import { NumberingSettings } from '../components/impostazioni/NumberingSettings';
import { UsersSettings } from '../components/impostazioni/UsersSettings';
import { PreferencesSettings } from '../components/impostazioni/PreferencesSettings';
import { DataSettings } from '../components/impostazioni/DataSettings';
import { useCan } from '../auth/hooks';
import type { Action, Resource } from '../auth/permissions';
import { useT, type TKey } from '../i18n';
import '../styles/app-shell.css';
import '../styles/impostazioni.css';

interface SettingsTab {
    id: string;
    label: TKey;
    icon: string;
    component: ComponentType<{ canEdit: boolean }>;
    /** Permesso per vedere la scheda e permesso per modificarla. */
    read: [Resource, Action];
    edit: [Resource, Action];
}

const TABS: SettingsTab[] = [
    { id: 'azienda', label: 'settings.tabs.azienda', icon: 'fa-building', component: CompanySettings, read: ['impostazioni', 'read'], edit: ['impostazioni', 'update'] },
    { id: 'aspetto', label: 'settings.tabs.aspetto', icon: 'fa-palette', component: AppearanceSettings, read: ['impostazioni', 'read'], edit: ['impostazioni', 'update'] },
    { id: 'moduli', label: 'settings.tabs.moduli', icon: 'fa-puzzle-piece', component: ModulesSettings, read: ['impostazioni', 'read'], edit: ['impostazioni', 'update'] },
    { id: 'tabelle', label: 'settings.tabs.tabelle', icon: 'fa-table-list', component: TablesSettings, read: ['impostazioni', 'read'], edit: ['impostazioni', 'update'] },
    { id: 'numerazioni', label: 'settings.tabs.numerazioni', icon: 'fa-hashtag', component: NumberingSettings, read: ['impostazioni', 'read'], edit: ['impostazioni', 'update'] },
    { id: 'utenti', label: 'settings.tabs.utenti', icon: 'fa-users-gear', component: UsersSettings, read: ['organizzazione', 'read'], edit: ['organizzazione', 'update'] },
    { id: 'preferenze', label: 'settings.tabs.preferenze', icon: 'fa-language', component: PreferencesSettings, read: ['impostazioni', 'read'], edit: ['impostazioni', 'update'] },
    { id: 'dati', label: 'settings.tabs.dati', icon: 'fa-database', component: DataSettings, read: ['impostazioni', 'read'], edit: ['impostazioni', 'update'] },
];

/**
 * Impostazioni del tenant. Ogni scheda modifica una sezione di TenantConfig
 * (persistita come override locale, vedi config/configStore.ts): nessuna
 * personalizzazione richiede di toccare il codice. Scheda attiva nell'URL.
 */
export function Impostazioni() {
    const t = useT();
    const can = useCan();
    const [params, setParams] = useSearchParams();

    const tabs = TABS.filter((tab) => can(...tab.read));
    const active = tabs.find((tab) => tab.id === params.get('tab')) ?? tabs[0]!;
    const Active = active.component;

    return (
        <AppLayout pageClass="app-page">
            <Topbar>
                <h1>{t('settings.title')}</h1>
                <p>{t('settings.subtitle')}</p>
            </Topbar>

            <div className="settings-layout">
                <nav className="neu-panel settings-nav" role="tablist" aria-orientation="vertical" aria-label={t('settings.title')}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            id={`tab-${tab.id}`}
                            aria-selected={tab.id === active.id}
                            aria-controls="settings-panel"
                            className={`nav-item nav-item--button${tab.id === active.id ? ' active' : ''}`}
                            onClick={() => setParams({ tab: tab.id }, { replace: true })}
                        >
                            <i className={`fa-solid ${tab.icon}`} />
                            <span>{t(tab.label)}</span>
                        </button>
                    ))}
                </nav>

                <div className="settings-content" role="tabpanel" id="settings-panel" aria-labelledby={`tab-${active.id}`}>
                    <Active key={active.id} canEdit={can(...active.edit)} />
                </div>
            </div>
        </AppLayout>
    );
}
