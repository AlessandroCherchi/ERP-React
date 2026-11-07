import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { SystemPage } from './SystemPage';
import { useT } from '../../i18n';
import type { ModuleDef } from '../../app/modules';

export function NotFound() {
    const t = useT();
    return <SystemPage icon="fa-compass" title={t('system.notFoundTitle')} text={t('system.notFoundText')} />;
}

export function Forbidden() {
    const t = useT();
    return <SystemPage icon="fa-lock" title={t('system.forbiddenTitle')} text={t('system.forbiddenText')} />;
}

export function ModuleDisabled() {
    const t = useT();
    return <SystemPage icon="fa-toggle-off" title={t('system.disabledTitle')} text={t('system.disabledText')} />;
}

export function ComingSoon({ module }: { module: ModuleDef }) {
    const t = useT();
    return (
        <SystemPage
            icon={module.icon}
            title={t('system.soonTitle', { module: t(module.labelKey) })}
            text={t('system.soonText')}
        />
    );
}

/**
 * errorElement del router: cattura errori di render e di caricamento chunk.
 * Il dettaglio va in console (e, con lo step Observability, a Sentry con
 * redaction — spec §14), mai a schermo: niente stack trace all'utente (§4).
 */
export function RouteError() {
    const error = useRouteError();
    const t = useT();
    if (isRouteErrorResponse(error) && error.status === 404) return <NotFound />;
    console.error('[route-error]', error);
    return (
        <SystemPage
            icon="fa-triangle-exclamation"
            title={t('system.errorTitle')}
            text={t('system.errorText')}
            action={{ label: t('common.retry'), onClick: () => window.location.reload() }}
        />
    );
}
