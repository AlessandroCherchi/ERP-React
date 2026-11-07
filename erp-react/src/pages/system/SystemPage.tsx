import { Link } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { Topbar } from '../../components/layout/Topbar';
import { useSession } from '../../auth/session';
import { useT } from '../../i18n';
import '../../styles/app-shell.css';

interface SystemPageProps {
    icon: string;
    title: string;
    text: string;
    /** Azione secondaria (es. "Riprova"). */
    action?: { label: string; onClick: () => void };
}

/**
 * Pagina di stato (404, errore, accesso negato, modulo non attivo/in sviluppo).
 * Dentro il layout applicativo se c'è una sessione — l'utente non perde il
 * menu — altrimenti a pagina piena.
 */
export function SystemPage({ icon, title, text, action }: SystemPageProps) {
    const session = useSession();
    const t = useT();

    const body = (
        <section className="neu-panel system-panel">
            <div className="system-icon"><i className={`fa-solid ${icon}`} /></div>
            <h2>{title}</h2>
            <p>{text}</p>
            <div className="system-actions">
                {action && (
                    <button type="button" className="neu-action-btn neu-action-btn--outline" onClick={action.onClick}>
                        <span>{action.label}</span>
                    </button>
                )}
                <Link to={session ? '/dashboard' : '/login'} className="neu-action-btn">
                    <i className="fa-solid fa-house" />
                    <span>{session ? t('system.goHome') : t('auth.backToLogin')}</span>
                </Link>
            </div>
        </section>
    );

    if (!session) return <div className="app-page app-page--center">{body}</div>;

    return (
        <AppLayout pageClass="app-page">
            <Topbar><h1>{title}</h1></Topbar>
            {body}
        </AppLayout>
    );
}
