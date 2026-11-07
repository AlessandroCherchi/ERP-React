import { useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { ActionButton } from '../ui/Button';
import { ProdottoFormFields } from './ProdottoFormFields';
import { useValidatedForm } from '../../lib/validation';
import { prodottoSchema } from '../../lib/schemas/quickActions';
import { EMPTY_PRODOTTO, type ProdottoForm } from '../../types/quickActions';
import type { Prodotto } from '../../types/prodotto';

interface ProdottoModalProps {
    open: boolean;
    onClose: () => void;
    /** null = nuovo prodotto, Prodotto = modifica. */
    editing?: Prodotto | null;
    onSubmit: (values: ProdottoForm) => void;
    /** Valori precompilati per la creazione (es. SKU progressivo). */
    defaults?: Partial<ProdottoForm>;
    saving?: boolean;
    /** Ragioni sociali dall'anagrafica fornitori, per la select Fornitore. */
    fornitori?: string[];
}

/** Prodotto (numerico, dal server) → valori del form (string). */
function toFormValues(p: Prodotto): ProdottoForm {
    return {
        nome: p.nome,
        sku: p.sku,
        categoria: p.categoria,
        fornitore: p.fornitore,
        costo: String(p.costo),
        prezzo: String(p.prezzo),
        giacenza: String(p.giacenza),
        scorta: String(p.scorta),
        unita: p.unita,
        iva: String(p.iva),
        ubicazione: p.ubicazione,
        descrizione: p.descrizione,
    };
}

/**
 * Modale Nuovo/Modifica Prodotto — porting di #modalProdotto in
 * dashboard.html, esteso alla modifica per la pagina Inventario.
 * Usato sia dalla quick action della Dashboard (editing assente) sia
 * dal CRUD di Inventario: stesso pattern di ClientModal.
 */
export function ProdottoModal({
    open, onClose, editing = null, onSubmit, defaults, saving = false, fornitori,
}: ProdottoModalProps) {
    const { values, errors, setField, validate, reset } = useValidatedForm<ProdottoForm>(
        prodottoSchema,
        EMPTY_PRODOTTO
    );

    useEffect(() => {
        if (!open) return;
        reset(editing ? toFormValues(editing) : { ...EMPTY_PRODOTTO, ...defaults });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, editing]);

    function handleSave() {
        if (!validate()) return;
        onSubmit(values);
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={editing ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
            footer={
                <>
                    <ActionButton variant="outline" onClick={onClose}>Annulla</ActionButton>
                    <ActionButton icon="fa-check" onClick={handleSave} disabled={saving}>
                        {editing ? 'Salva Modifiche' : 'Salva Prodotto'}
                    </ActionButton>
                </>
            }
        >
            <ProdottoFormFields
                values={values}
                errors={errors}
                setField={setField}
                mode={editing ? 'edit' : 'create'}
                fornitori={fornitori}
            />
        </Modal>
    );
}
