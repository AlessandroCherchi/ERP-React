import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import '../../styles/erp-ui.css';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
    id: number;
    message: string;
    type: ToastType;
    removing: boolean;
}

interface ToastContextValue {
    toast: (message: string, type?: ToastType) => void;
}

const TOAST_LIFETIME = 3500;
const TOAST_FADEOUT = 400;

const TOAST_ICONS: Record<ToastType, string> = {
    success: 'fa-circle-check',
    error: 'fa-circle-xmark',
    info: 'fa-circle-info',
};

const ToastContext = createContext<ToastContextValue | null>(null);

/** Provider unico dei toast: monta una sola volta in App/root layout. */
export function ToastProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<ToastItem[]>([]);
    const idRef = useRef(0);

    const toast = useCallback((message: string, type: ToastType = 'success') => {
        const id = ++idRef.current;
        setItems((prev) => [...prev, { id, message, type, removing: false }]);

        setTimeout(() => {
            setItems((prev) => prev.map((t) => (t.id === id ? { ...t, removing: true } : t)));
            setTimeout(() => {
                setItems((prev) => prev.filter((t) => t.id !== id));
            }, TOAST_FADEOUT);
        }, TOAST_LIFETIME);
    }, []);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="toast-container">
                {items.map((t) => (
                    <div
                        key={t.id}
                        className={`toast toast--${t.type}${t.removing ? ' removing' : ''}`}
                        role="status"
                        aria-live="polite"
                    >
                        <div className="toast-icon">
                            <i className={`fa-solid ${TOAST_ICONS[t.type]}`} />
                        </div>
                        <span className="toast-message">{t.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

/** Hook: const { toast } = useToast(); toast('Salvato', 'success'); */
export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast va usato dentro <ToastProvider>');
    return ctx;
}
