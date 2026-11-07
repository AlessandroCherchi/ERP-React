import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import '../../styles/erp-ui.css';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'default' | 'sm';
}

/** Modale generico: stessa struttura/animazione/focus-trap di erp-ui.js openModal/closeModal. */
export function Modal({ open, onClose, title, children, footer, size = 'default' }: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const lastFocused = useRef<HTMLElement | null>(null);

    // focus sul primo campo utile all'apertura + ripristino alla chiusura
    useEffect(() => {
        if (!open) return;
        lastFocused.current = document.activeElement as HTMLElement | null;

        const t = setTimeout(() => {
            const first = modalRef.current?.querySelector<HTMLElement>(
                '.modal-body input, .modal-body select, .modal-body textarea'
            );
            first?.focus();
        }, 60);

        return () => {
            clearTimeout(t);
            lastFocused.current?.focus?.();
        };
    }, [open]);

    // ESC per chiudere + focus trap (TAB confinato nel modale)
    useEffect(() => {
        if (!open) return;

        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                onClose();
                return;
            }
            if (e.key !== 'Tab' || !modalRef.current) return;

            const focusables = modalRef.current.querySelectorAll<HTMLElement>(
                'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
            );
            if (!focusables.length) return;

            const first = focusables[0]!;
            const last = focusables[focusables.length - 1]!;

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }

        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    return createPortal(
        <>
            <div className={`modal-overlay${open ? ' open' : ''}`} onClick={onClose} />
            <div
                ref={modalRef}
                className={`modal${size === 'sm' ? ' modal--sm' : ''}${open ? ' open' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-hidden={!open}
            >
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button
                        type="button"
                        className="neu-action-btn neu-action-btn--outline neu-icon-btn--sm"
                        onClick={onClose}
                        aria-label="Chiudi"
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>
                <div className="modal-body">{children}</div>
                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </>,
        document.body
    );
}
