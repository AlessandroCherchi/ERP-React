import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import defaultLogo from '../assets/img/logo.png';
import { useConfig } from '../config/configStore';
import { DEMO_USERS, AuthError, useAuthStore, useSession } from '../auth/session';
import { useT } from '../i18n';
import '../styles/login.css';

/**
 * Login — stessa marcatura e animazione flip di index.html, ora con un
 * flusso reale (mock): validazione, stato di invio, errore, redirect alla
 * pagina richiesta. Il retro non crea account: in un gestionale enterprise
 * gli utenti sono invitati dall'amministratore del tenant.
 */
export function Login() {
    const config = useConfig();
    const session = useSession();
    const login = useAuthStore((s) => s.login);
    const navigate = useNavigate();
    const location = useLocation();
    const t = useT();

    const [flipped, setFlipped] = useState(false);
    const [remember, setRemember] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

    if (session) return <Navigate to={from} replace />;

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!email.trim() || !password) {
            setError(t('auth.required'));
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            await login(email, password, { remember, tenantId: config.id });
            navigate(from, { replace: true });
        } catch (err) {
            setError(err instanceof AuthError ? t('auth.invalid') : String(err));
            setSubmitting(false);
        }
    }

    function fillDemo(demoEmail: string) {
        setEmail(demoEmail);
        setPassword('demo');
        setError('');
    }

    const logo = config.brand.logo || defaultLogo;

    return (
        <div className="login-page">
            <div className="login-wrapper">
                <div className={`flip-scene${flipped ? ' flipped' : ''}`}>
                    <div className="flip-card">

                        {/* FRONT — LOGIN */}
                        <div className="glass-circle front">
                            <div className="accent-ring" />

                            <form className="login-form" onSubmit={handleSubmit} noValidate>
                                <img src={logo} alt={config.brand.name} className="form-logo" />
                                <h1>{t('auth.loginTitle')}</h1>
                                <div className="subtitle">{config.brand.name}</div>

                                <div className="input-box">
                                    <i className="fa-solid fa-user" />
                                    <input
                                        type="email"
                                        placeholder={t('auth.email')}
                                        aria-label={t('auth.email')}
                                        autoComplete="username"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                <div className="input-box">
                                    <i className="fa-solid fa-lock" />
                                    <input
                                        type="password"
                                        placeholder={t('auth.password')}
                                        aria-label={t('auth.password')}
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>

                                <div className="login-error" role="alert" aria-live="assertive">{error}</div>

                                <div className="forgot">
                                    <div className="remember">
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={remember}
                                            aria-label={t('auth.remember')}
                                            className={`switch${remember ? ' on' : ''}`}
                                            onClick={() => setRemember((v) => !v)}
                                        />
                                        {t('auth.remember')}
                                    </div>
                                </div>

                                <button type="submit" disabled={submitting}>
                                    {submitting ? t('auth.submitting') : t('auth.submit')}
                                </button>

                                <div className="signup-text">
                                    {t('auth.noAccount')}{' '}
                                    <button type="button" className="link-btn" onClick={() => setFlipped(true)}>
                                        {t('auth.requestAccess')}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* BACK — RICHIESTA ACCESSO */}
                        <div className="glass-circle back">
                            <div className="accent-ring" />

                            <div className="login-form">
                                <img src={logo} alt={config.brand.name} className="form-logo" />
                                <h1>{t('auth.signupTitle')}</h1>
                                <div className="subtitle">{t('auth.signupSubtitle')}</div>
                                <p className="login-info">{t('auth.signupText')}</p>
                                {config.company.email && (
                                    <a className="login-info-link" href={`mailto:${config.company.email}`}>
                                        <i className="fa-solid fa-envelope" /> {config.company.email}
                                    </a>
                                )}
                                <div className="signup-text">
                                    {t('auth.haveAccount')}{' '}
                                    <button type="button" className="link-btn" onClick={() => setFlipped(false)}>
                                        {t('auth.backToLogin')}
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {config.features.demoLogin && (
                <aside className="demo-accounts" aria-label={t('auth.demoTitle')}>
                    <strong>{t('auth.demoTitle')}</strong>
                    <ul>
                        {DEMO_USERS.map((u) => (
                            <li key={u.id}>
                                <button type="button" onClick={() => fillDemo(u.email)}>
                                    <span>{t(`roles.${u.role}`)}</span>
                                    <em>{u.email}</em>
                                </button>
                            </li>
                        ))}
                    </ul>
                </aside>
            )}
        </div>
    );
}
