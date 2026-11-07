import { useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { ActionButton } from '../ui/Button';
import { FormGroup, FormRow, InputBox, SelectBox, TextareaBox } from '../ui/FormField';
import { RigheEditor } from '../documenti/RigheEditor';
import { useValidatedForm } from '../../lib/validation';
import { acquistoSchema } from '../../lib/schemas/acquisto';
import { today } from '../../lib/format';
import { EMPTY_ACQUISTO_FORM, type AcquistoFormValues, type OrdineAcquisto } from '../../types/acquisto';
import type { FornitoreRef } from '../../types/fornitore';
import type { Prodotto } from '../../types/prodotto';

interface AcquistoModalProps {
    open: boolean;
    onClose: () => void;
    editing: OrdineAcquisto | null;
    onSubmit: (values: AcquistoFormValues) => void;
    saving: boolean;
    fornitori: FornitoreRef[];
    prodotti: Prodotto[];
    numeroSuggerito: string;
}

/**
 * Nuovo/modifica ordine d'acquisto. Il catalogo propone prima gli articoli
 * del fornitore scelto; il prezzo proposto è il costo attuale dell'articolo.
 */
export function AcquistoModal({ open, onClose, editing, onSubmit, saving, fornitori, prodotti, numeroSuggerito }: AcquistoModalProps) {
    const { values, errors, setField, validate, reset } = useValidatedForm<AcquistoFormValues>(acquistoSchema, EMPTY_ACQUISTO_FORM);

    useEffect(() => {
        if (!open) return;
        reset(editing
            ? { numero: editing.numero, fornitoreId: editing.fornitoreId, data: editing.data, consegna: editing.consegna, note: editing.note, righe: editing.righe.map(({ ricevuta: _r, ...r }) => r) }
            : { ...EMPTY_ACQUISTO_FORM, numero: numeroSuggerito, data: today() });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, editing]);

    const catalogo = useMemo(() => {
        if (!values.fornitoreId) return prodotti;
        const suoi = prodotti.filter((p) => p.fornitoreId === values.fornitoreId);
        return [...suoi, ...prodotti.filter((p) => p.fornitoreId !== values.fornitoreId)];
    }, [prodotti, values.fornitoreId]);

    const opzioni = fornitori.filter((f) => f.attivo || f.id === values.fornitoreId);

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={editing ? `Modifica ${editing.numero}` : 'Nuovo Ordine d’Acquisto'}
            footer={
                <>
                    <ActionButton variant="outline" onClick={onClose}>Annulla</ActionButton>
                    <ActionButton icon="fa-check" disabled={saving} onClick={() => validate() && onSubmit(values)}>Salva bozza</ActionButton>
                </>
            }
        >
            <FormRow>
                <FormGroup label="Fornitore *" error={errors.fornitoreId}>
                    <SelectBox value={values.fornitoreId || ''} onChange={(e) => setField('fornitoreId', Number(e.target.value))}>
                        <option value="" disabled>Seleziona un fornitore…</option>
                        {opzioni.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                    </SelectBox>
                </FormGroup>
                <FormGroup label="Numero *" error={errors.numero}>
                    <InputBox icon="fa-hashtag" value={values.numero} onChange={(e) => setField('numero', e.target.value)} />
                </FormGroup>
            </FormRow>
            <FormRow>
                <FormGroup label="Data ordine *" error={errors.data}>
                    <InputBox icon="fa-calendar-day" type="date" value={values.data} onChange={(e) => setField('data', e.target.value)} />
                </FormGroup>
                <FormGroup label="Consegna prevista" error={errors.consegna}>
                    <InputBox icon="fa-calendar-check" type="date" value={values.consegna} onChange={(e) => setField('consegna', e.target.value)} />
                </FormGroup>
            </FormRow>
            <FormRow>
                <div className="form-group--full">
                    <RigheEditor
                        righe={values.righe}
                        prodotti={catalogo}
                        onChange={(righe) => setField('righe', righe)}
                        error={errors.righe}
                        prezzoDi={(p) => p.costo}
                        verificaGiacenza={false}
                        totaleLabel="Totale ordine"
                    />
                </div>
            </FormRow>
            <FormRow>
                <FormGroup label="Note" full>
                    <TextareaBox rows={2} value={values.note} onChange={(e) => setField('note', e.target.value)} />
                </FormGroup>
            </FormRow>
        </Modal>
    );
}
