import { createContext, useContext } from 'react';

export interface ConfirmOptions {
    title?: string;
    text?: string;
    confirmLabel?: string;
    icon?: string;
    tone?: 'danger' | 'accent';
    onConfirm?: () => void;
}

export interface ConfirmContextValue {
    confirm: (opts: ConfirmOptions) => void;
}

export const ConfirmContext = createContext<ConfirmContextValue | null>(null);

/** Hook: const { confirm } = useConfirm(); confirm({ title, text, onConfirm }); */
export function useConfirm(): ConfirmContextValue {
    const ctx = useContext(ConfirmContext);
    if (!ctx) throw new Error('useConfirm va usato dentro <ConfirmProvider>');
    return ctx;
}
