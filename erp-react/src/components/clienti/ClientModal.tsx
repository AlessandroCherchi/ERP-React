import { useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { ActionButton } from '../ui/Button';
import { ClientFormFields } from './ClientFormFields';
import { useValidatedForm } from '../../lib/validation';
import { clienteSchema } from '../../lib/schemas/cliente';
import { EMPTY_CLIENTE_FORM, type Cliente, type ClienteFormValues } from '../../types/cliente';

interface ClientModalProps {
    open: boolean;
    onClose: () => void;
    /** null = nuovo cliente, Cliente = modifica. */
    editing: Cliente | null;
    onSubmit: (values: ClienteFormValues) => void;
    saving: boolean;
}

/** Modale Nuovo/Modifica Cliente — porting 1:1 di #clientModal in clienti.html. */
export function ClientModal({ open, onClose, editing, onSubmit, saving }: ClientModalProps) {
    const { values, errors, setField, validate, reset } = useValidatedForm<ClienteFormValues>(
        clienteSchema,
        EMPTY_CLIENTE_FORM
    );

    useEffect(() => {
        if (!open) return;
        reset(
            editing
                ? {
                      nome: editing.nome, email: editing.email, telefono: editing.telefono,
                      citta: editing.citta, provincia: editing.provincia, indirizzo: editing.indirizzo,
                      piva: editing.piva, cf: editing.cf, pec: editing.pec, sdi: editing.sdi,
                      stato: editing.stato, note: editing.note,
                  }
                : EMPTY_CLIENTE_FORM
        );
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
            title={editing ? 'Modifica Cliente' : 'Nuovo Cliente'}
            footer={
                <>
                    <ActionButton variant="outline" onClick={onClose}>Annulla</ActionButton>
                    <ActionButton icon="fa-check" onClick={handleSave} disabled={saving}>
                        {editing ? 'Salva Modifiche' : 'Salva Cliente'}
                    </ActionButton>
                </>
            }
        >
            <ClientFormFields values={values} errors={errors} setField={setField} />
        </Modal>
    );
}
