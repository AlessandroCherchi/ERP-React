import { useEffect } from 'react';
import { useConfig } from '../../config/configStore';
import { Modal } from '../ui/Modal';
import { ActionButton } from '../ui/Button';
import { FornitoreFormFields } from './FornitoreFormFields';
import { useValidatedForm } from '../../lib/validation';
import { fornitoreSchema } from '../../lib/schemas/fornitore';
import { EMPTY_FORNITORE_FORM, type Fornitore, type FornitoreFormValues } from '../../types/fornitore';

interface FornitoreModalProps {
    open: boolean;
    onClose: () => void;
    /** null = nuovo fornitore, Fornitore = modifica. */
    editing: Fornitore | null;
    onSubmit: (values: FornitoreFormValues) => void;
    saving: boolean;
}

/** Fornitore (dal server) → valori del form. */
function toFormValues(f: Fornitore): FornitoreFormValues {
    const { id: _id, acquistato: _a, ordini: _o, debito: _d, ...form } = f;
    return form;
}

/** Modale Nuovo/Modifica Fornitore — stessa struttura di ClientModal. */
export function FornitoreModal({ open, onClose, editing, onSubmit, saving }: FornitoreModalProps) {
    const { tables } = useConfig();
    const { values, errors, setField, validate, reset } = useValidatedForm<FornitoreFormValues>(
        fornitoreSchema,
        EMPTY_FORNITORE_FORM
    );

    useEffect(() => {
        if (!open) return;
        reset(editing ? toFormValues(editing) : {
            ...EMPTY_FORNITORE_FORM,
            categoria: tables.categorie[0]?.value ?? '',
            pagamento: tables.terminiPagamento[0]?.value ?? '0',
        });
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
            title={editing ? 'Modifica Fornitore' : 'Nuovo Fornitore'}
            footer={
                <>
                    <ActionButton variant="outline" onClick={onClose}>Annulla</ActionButton>
                    <ActionButton icon="fa-check" onClick={handleSave} disabled={saving}>
                        {editing ? 'Salva Modifiche' : 'Salva Fornitore'}
                    </ActionButton>
                </>
            }
        >
            <FornitoreFormFields values={values} errors={errors} setField={setField} />
        </Modal>
    );
}
