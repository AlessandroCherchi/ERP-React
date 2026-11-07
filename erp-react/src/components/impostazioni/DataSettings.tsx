import { SettingsCard } from './SettingsCard';
import { ActionButton } from '../ui/Button';
import { useConfirm } from '../ui/confirmContext';
import { useConfig } from '../../config/configStore';
import { resetDemoData } from '../../data';
import { downloadJson, today } from '../../lib/format';
import { useT } from '../../i18n';

/** Manutenzione: export della configurazione, ripristino del dataset demo. */
export function DataSettings({ canEdit }: { canEdit: boolean }) {
    const t = useT();
    const { confirm } = useConfirm();
    const config = useConfig();

    function reset() {
        confirm({
            title: t('settings.data.resetTitle'),
            text: t('settings.data.resetConfirm'),
            confirmLabel: t('settings.data.resetButton'),
            icon: 'fa-database',
            onConfirm: () => {
                resetDemoData();
                window.location.reload();
            },
        });
    }

    return (
        <>
            <SettingsCard title={t('settings.data.exportTitle')} description={t('settings.data.exportText')} canEdit>
                <ActionButton icon="fa-file-arrow-down" onClick={() => downloadJson(`tenant_${config.id}_${today()}.json`, config)}>
                    {t('settings.data.exportButton')}
                </ActionButton>
            </SettingsCard>
            {canEdit && (
                <SettingsCard title={t('settings.data.resetTitle')} description={t('settings.data.resetText')} canEdit>
                    <ActionButton variant="danger" icon="fa-rotate" onClick={reset}>{t('settings.data.resetButton')}</ActionButton>
                </SettingsCard>
            )}
        </>
    );
}
