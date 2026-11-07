import { AnagraficaFormFields } from '../anagrafica/AnagraficaFormFields';
import { CLIENTE_STATI, type ClienteFormValues } from '../../types/cliente';
import type { FieldErrors } from '../../lib/validation';

interface ClientFormFieldsProps {
    values: ClienteFormValues;
    errors: FieldErrors<ClienteFormValues>;
    setField: <K extends keyof ClienteFormValues>(key: K, value: ClienteFormValues[K]) => void;
}

/**
 * Campi anagrafica cliente — porting 1:1 del modale "Nuovo Cliente" di
 * clienti.html. I campi sono quelli comuni a tutte le anagrafiche, quindi
 * questo componente si limita a scegliere il lessico e gli stati ammessi:
 * il markup vive in AnagraficaFormFields, condiviso con i Fornitori.
 *
 * Condiviso da Clienti.tsx e dalla quick action "Aggiungi Cliente" della
 * Dashboard: stessi campi in entrambi i posti, come nell'originale.
 */
export function ClientFormFields({ values, errors, setField }: ClientFormFieldsProps) {
    return (
        <AnagraficaFormFields
            values={values}
            errors={errors}
            setField={setField}
            statoOptions={CLIENTE_STATI}
            nomeLabel="Ragione Sociale *"
            nomePlaceholder="Es. Rossi S.r.l."
        />
    );
}
