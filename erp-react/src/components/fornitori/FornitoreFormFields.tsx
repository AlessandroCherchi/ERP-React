import { AnagraficaFormFields } from '../anagrafica/AnagraficaFormFields';
import { FormGroup, FormRow, InputBox, SelectBox } from '../ui/FormField';
import { FORNITORE_STATI, type FornitoreFormValues } from '../../types/fornitore';
import type { FieldErrors } from '../../lib/validation';
import { useConfig } from '../../config/configStore';
import { optionsWithCurrent } from '../../config';

interface FornitoreFormFieldsProps {
    values: FornitoreFormValues;
    errors: FieldErrors<FornitoreFormValues>;
    setField: <K extends keyof FornitoreFormValues>(key: K, value: FornitoreFormValues[K]) => void;
}

/**
 * Campi del fornitore: l'anagrafica comune (condivisa con i Clienti) più i
 * dati di fornitura, iniettati come righe extra invece di riscrivere il form.
 * Le categorie sono le stesse del magazzino, così il fornitore si aggancia
 * alle categorie merceologiche già esistenti in Inventario.
 */
export function FornitoreFormFields({ values, errors, setField }: FornitoreFormFieldsProps) {
    const { tables } = useConfig();
    return (
        <AnagraficaFormFields
            values={values}
            errors={errors}
            setField={setField}
            statoOptions={FORNITORE_STATI}
            nomeLabel="Ragione Sociale *"
            nomePlaceholder="Es. Tecnoforniture S.p.A."
        >
            <FormRow>
                <FormGroup label="Categoria fornita">
                    <SelectBox
                        value={values.categoria}
                        onChange={(e) => setField('categoria', e.target.value)}
                    >
                        {optionsWithCurrent(tables.categorie, values.categoria).map((c) => (
                            <option value={c.value} key={c.value}>{c.label}</option>
                        ))}
                    </SelectBox>
                </FormGroup>
                <FormGroup label="Termini di pagamento">
                    <SelectBox
                        value={values.pagamento}
                        onChange={(e) => setField('pagamento', e.target.value)}
                    >
                        {optionsWithCurrent(tables.terminiPagamento, values.pagamento).map((t) => (
                            <option value={t.value} key={t.value}>{t.label}</option>
                        ))}
                    </SelectBox>
                </FormGroup>
            </FormRow>

            <FormRow>
                <FormGroup label="Lead time (giorni)">
                    <InputBox
                        icon="fa-truck-fast"
                        type="number"
                        min={0}
                        step={1}
                        placeholder="7"
                        value={String(values.leadTime)}
                        onChange={(e) => setField('leadTime', Number(e.target.value) || 0)}
                    />
                </FormGroup>
                <FormGroup label="IBAN">
                    <InputBox
                        icon="fa-building-columns"
                        placeholder="IT60X0542811101000000123456"
                        maxLength={27}
                        value={values.iban}
                        onChange={(e) => setField('iban', e.target.value.toUpperCase())}
                    />
                </FormGroup>
            </FormRow>
        </AnagraficaFormFields>
    );
}
