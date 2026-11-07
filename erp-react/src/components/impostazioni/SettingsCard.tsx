import type { ReactNode } from 'react';
import { ActionButton } from '../ui/Button';
import { useT } from '../../i18n';

interface SettingsCardProps {
    title: string;
    description?: string;
    children: ReactNode;
    /** Presenti solo nelle sezioni con salvataggio esplicito. */
    onSave?: () => void;
    onReset?: () => void;
    dirty?: boolean;
    /** Errori di validazione: bloccano il salvataggio. */
    invalid?: boolean;
    canEdit: boolean;
}

/** Card di una sezione Impostazioni con barra Salva/Ripristina. */
export function SettingsCard({ title, description, children, onSave, onReset, dirty = false, invalid = false, canEdit }: SettingsCardProps) {
    const t = useT();
    return (
        <section className="neu-panel settings-card">
            <header className="settings-card-header">
                <div>
                    <h2>{title}</h2>
                    {description && <p>{description}</p>}
                </div>
                {dirty && <span className="settings-dirty" role="status">{t('settings.unsaved')}</span>}
            </header>
            <fieldset className="settings-card-body" disabled={!canEdit}>{children}</fieldset>
            {canEdit && (onSave || onReset) && (
                <footer className="settings-card-footer">
                    {onReset && <ActionButton variant="outline" icon="fa-rotate-left" onClick={onReset}>{t('settings.reset')}</ActionButton>}
                    {onSave && <ActionButton icon="fa-check" disabled={!dirty || invalid} onClick={onSave}>{t('settings.save')}</ActionButton>}
                </footer>
            )}
        </section>
    );
}
