import type { ReactNode } from 'react';
import { FormGroup, FormRow, InputBox, SelectBox, TextareaBox } from '../ui/FormField';
import type { AnagraficaBase, StatoOption } from '../../types/anagrafica';
import type { FieldErrors } from '../../lib/validation';

/** Qualunque form che porti l'anagrafica comune più uno stato. */
type AnagraficaFormShape = AnagraficaBase & { stato: string };

interface AnagraficaFormFieldsProps<T extends AnagraficaFormShape> {
    values: T;
    errors: FieldErrors<T>;
    setField: <K extends keyof T>(key: K, value: T[K]) => void;
    /** Voci della select Stato: cambiano per entità (prospect vs sospeso). */
    statoOptions: StatoOption[];
    /** Etichetta e placeholder del campo nome, per adattare il lessico. */
    nomeLabel?: string;
    nomePlaceholder?: string;
    /** Righe aggiuntive specifiche dell'entità, inserite prima delle note. */
    children?: ReactNode;
}

/**
 * Campi anagrafici comuni a Clienti e Fornitori — porting 1:1 del modale
 * "Nuovo Cliente" di clienti.html.
 *
 * La spec §5 tratta "Clienti/fornitori" come un modulo solo: qui i due
 * condividono davvero lo stesso form, e ogni entità aggiunge i propri campi
 * tramite `children` invece di ricopiare gli undici campi comuni.
 */
export function AnagraficaFormFields<T extends AnagraficaFormShape>({
    values, errors, setField, statoOptions,
    nomeLabel = 'Ragione Sociale *',
    nomePlaceholder = 'Es. Rossi S.r.l.',
    children,
}: AnagraficaFormFieldsProps<T>) {
    return (
        <>
            <FormRow>
                <FormGroup label={nomeLabel} error={errors.nome}>
                    <InputBox
                        icon="fa-building"
                        placeholder={nomePlaceholder}
                        value={values.nome}
                        onChange={(e) => setField('nome' as keyof T, e.target.value as T[keyof T])}
                    />
                </FormGroup>
                <FormGroup label="Email *" error={errors.email}>
                    <InputBox
                        icon="fa-envelope"
                        type="email"
                        placeholder="info@azienda.it"
                        value={values.email}
                        onChange={(e) => setField('email' as keyof T, e.target.value as T[keyof T])}
                    />
                </FormGroup>
            </FormRow>

            <FormRow>
                <FormGroup label="Telefono">
                    <InputBox
                        icon="fa-phone"
                        type="tel"
                        placeholder="+39 02 1234567"
                        value={values.telefono}
                        onChange={(e) => setField('telefono' as keyof T, e.target.value as T[keyof T])}
                    />
                </FormGroup>
                <FormGroup label="Partita IVA">
                    <InputBox
                        icon="fa-hashtag"
                        placeholder="IT01234567890"
                        maxLength={13}
                        value={values.piva}
                        onChange={(e) => setField('piva' as keyof T, e.target.value as T[keyof T])}
                    />
                </FormGroup>
            </FormRow>

            <FormRow>
                <FormGroup label="Codice Fiscale">
                    <InputBox
                        icon="fa-id-card"
                        placeholder="01234567890"
                        maxLength={16}
                        value={values.cf}
                        onChange={(e) => setField('cf' as keyof T, e.target.value as T[keyof T])}
                    />
                </FormGroup>
                <FormGroup label="PEC" error={errors.pec}>
                    <InputBox
                        icon="fa-envelope-circle-check"
                        type="email"
                        placeholder="azienda@pec.it"
                        value={values.pec}
                        onChange={(e) => setField('pec' as keyof T, e.target.value as T[keyof T])}
                    />
                </FormGroup>
            </FormRow>

            <FormRow>
                <FormGroup label="Codice SDI">
                    <InputBox
                        icon="fa-barcode"
                        placeholder="ABC1234"
                        maxLength={7}
                        value={values.sdi}
                        onChange={(e) => setField('sdi' as keyof T, e.target.value as T[keyof T])}
                    />
                </FormGroup>
                <FormGroup label="Stato">
                    <SelectBox
                        value={values.stato}
                        onChange={(e) => setField('stato' as keyof T, e.target.value as T[keyof T])}
                    >
                        {statoOptions.map((s) => (
                            <option value={s.value} key={s.value}>{s.label}</option>
                        ))}
                    </SelectBox>
                </FormGroup>
            </FormRow>

            <FormRow>
                <FormGroup label="Indirizzo" full>
                    <InputBox
                        icon="fa-location-dot"
                        placeholder="Via Roma 1, 20100"
                        value={values.indirizzo}
                        onChange={(e) => setField('indirizzo' as keyof T, e.target.value as T[keyof T])}
                    />
                </FormGroup>
            </FormRow>

            <FormRow>
                <FormGroup label="Città">
                    <InputBox
                        icon="fa-city"
                        placeholder="Milano"
                        value={values.citta}
                        onChange={(e) => setField('citta' as keyof T, e.target.value as T[keyof T])}
                    />
                </FormGroup>
                <FormGroup label="Provincia">
                    <InputBox
                        icon="fa-map"
                        placeholder="MI"
                        maxLength={2}
                        value={values.provincia}
                        onChange={(e) => setField('provincia' as keyof T, e.target.value.toUpperCase() as T[keyof T])}
                    />
                </FormGroup>
            </FormRow>

            {children}

            <FormRow>
                <FormGroup label="Note" full>
                    <TextareaBox
                        rows={3}
                        placeholder="Note aggiuntive..."
                        value={values.note}
                        onChange={(e) => setField('note' as keyof T, e.target.value as T[keyof T])}
                    />
                </FormGroup>
            </FormRow>
        </>
    );
}
