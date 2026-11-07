import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import '../../styles/erp-ui.css';

interface ConfirmOptions {
    title?: string;
    text?: string;
    confirmLabel?: string;
    icon?: string;
    tone?: 'danger' | 'accent';
    onConfirm?: () => void;
}

interface ConfirmContextValue {
    confirm: (opts: ConfirmOptions) => void;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

/** Provider unico del dialogo di conferma: monta una sola volta in App/root layout. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);
    const [opts, setOpts] = useState<ConfirmOptions>({});
    const yesRef = useRef<HTMLButtonElement>(null);

    const confirm = useCallback((next: ConfirmOptions) => {
        setOpts(next);
        setOpen(true);
        setTimeout(() => yesRef.current?.focus(), 60);
    }, []);

    const close = useCallback(() => setOpen(false), []);

    const handleYes = useCallback(() => {
        const run = opts.onConfirm;
        setOpen(false);
        run?.();
    }, [opts]);

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <div className={`confirm-overlay${open ? ' open' : ''}`} onClick={close} />
            <div
                className={`confirm-dialog${open ? ' open' : ''}`}
                role="alertdialog"
                aria-modal="true"
                aria-hidden={!open}
            >
                <div className={`confirm-icon${opts.tone === 'accent' ? ' confirm-icon--accent' : ''}`}>
                    <i className={`fa-solid ${opts.icon || 'fa-triangle-exclamation'}`} />
                </div>
                <h3>{opts.title || 'Conferma'}</h3>
                <p>{opts.text || ''}</p>
                <div className="confirm-actions">
                    <button type="button" className="neu-action-btn neu-action-btn--outline" onClick={close}>
                        Annulla
                    </button>
                    <button
                        ref={yesRef}
                        type="button"
                        className={`neu-action-btn${opts.tone !== 'accent' ? ' neu-action-btn--danger' : ''}`}
                        onClick={handleYes}
                    >
                        {opts.confirmLabel || 'Conferma'}
                    </button>
                </div>
            </div>
        </ConfirmContext.Provider>
    );
}

/** Hook: const { confirm } = useConfirm(); confirm({ title, text, onConfirm }); */
export function useConfirm(): ConfirmContextValue {
    const ctx = useContext(ConfirmContext);
    if (!ctx) throw new Error('useConfirm va usato dentro <ConfirmProvider>');
    return ctx;
}
