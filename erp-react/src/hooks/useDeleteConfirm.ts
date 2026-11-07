import { useConfirm } from '../components/ui/confirmContext';

/** Conferma standard di eliminazione: stesso testo e tono in tutto il prodotto. */
export function useDeleteConfirm() {
    const { confirm } = useConfirm();
    return (subject: string, onConfirm: () => void, extra = '') =>
        confirm({
            title: 'Conferma Eliminazione',
            text: `Sei sicuro di voler eliminare ${subject}? L'azione è irreversibile.${extra ? ` ${extra}` : ''}`,
            confirmLabel: 'Elimina',
            icon: 'fa-trash-can',
            onConfirm,
        });
}
