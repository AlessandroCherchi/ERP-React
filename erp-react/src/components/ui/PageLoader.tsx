import { useT } from '../../i18n';

/** Fallback di Suspense per il caricamento lazy delle pagine. */
export function PageLoader() {
    const t = useT();
    return (
        <div className="page-loader" role="status" aria-live="polite">
            <span className="page-loader-spinner" />
            <span className="sr-only">{t('common.loading')}</span>
        </div>
    );
}
