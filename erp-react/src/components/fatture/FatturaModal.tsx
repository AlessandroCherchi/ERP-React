import { useEffect } from 'react';
import * as v from 'valibot';
import { Modal } from '../ui/Modal';
import { ActionButton } from '../ui/Button';
import { FormGroup, FormRow, InputBox, SelectBox, TextareaBox } from '../ui/FormField';
import { RigheEditor } from '../documenti/RigheEditor';
import { useValidatedForm } from '../../lib/validation';
import { rigaSchema } from '../../lib/schemas/ordine';
import { useConfig } from '../../config/configStore';
import { today } from '../../lib/format';
import { EMPTY_FATTURA_FORM, TIPO_DOCUMENTO_LABEL, type Fattura, type FatturaFormValues } from '../../types/fattura';
import type { ClienteRef } from '../../types/cliente';
import type { Prodotto } from '../../types/prodotto';

const schema = v.object({
    tipo: v.picklist(['TD01', 'TD24', 'TD04'] as const),
    clienteId: v.pipe(v.number(), v.minValue(1, 'Seleziona un cliente')),
    data: v.pipe(v.string(), v.minLength(1, 'Campo obbligatorio')),
    terminiPagamento: v.string(),
    metodoPagamento: v.string(),
    righe: v.pipe(v.array(rigaSchema), v.minLength(1, 'Aggiungi almeno una riga')),
    note: v.string(),
    ordineIds: v.optional(v.array(v.number())),
    fatturaOrigineId: v.optional(v.number()),
}) as v.GenericSchema<FatturaFormValues>;

interface FatturaModalProps {
    open: boolean;
    onClose: () => void;
    /** Bozza in modifica, oppure valori iniziali (da ordini, nota di credito). */
    editing: Fattura | null;
    initial?: FatturaFormValues | null;
    onSubmit: (values: FatturaFormValues) => void;
    saving: boolean;
    clienti: ClienteRef[];
    prodotti: Prodotto[];
}

/** Bozza di fattura / nota di credito. Il numero lo assegna l'emissione. */
export function FatturaModal({ open, onClose, editing, initial, onSubmit, saving, clienti, prodotti }: FatturaModalProps) {
    const { tables } = useConfig();
    const { values, errors, setField, validate, reset } = useValidatedForm<FatturaFormValues>(schema, EMPTY_FATTURA_FORM);

    useEffect(() => {
        if (!open) return;
        reset(editing
            ? { tipo: editing.tipo, clienteId: editing.clienteId, data: editing.data, terminiPagamento: editing.terminiPagamento, metodoPagamento: editing.metodoPagamento, righe: editing.righe.map((r) => ({ ...r })), note: editing.note, ordineIds: editing.ordineIds, fatturaOrigineId: editing.fatturaOrigineId }
            : initial ?? { ...EMPTY_FATTURA_FORM, data: today(), terminiPagamento: tables.terminiPagamento[1]?.value ?? '30', metodoPagamento: tables.metodiPagamento[0]?.value ?? 'bonifico' });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, editing, initial]);

    const nc = values.tipo === 'TD04';
    // Da ordini o nota di credito: il cliente è vincolato al documento d'origine.
    const clienteBloccato = nc || Boolean(values.ordineIds?.length);

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={editing ? `Modifica bozza ${TIPO_DOCUMENTO_LABEL[editing.tipo].toLowerCase()}` : nc ? 'Nuova nota di credito' : 'Nuova fattura'}
            footer={
                <>
                    <ActionButton variant="outline" onClick={onClose}>Annulla</ActionButton>
                    <ActionButton icon="fa-check" disabled={saving} onClick={() => validate() && onSubmit(values)}>Salva bozza</ActionButton>
                </>
            }
        >
            <FormRow>
                <FormGroup label="Cliente *" error={errors.clienteId}>
                    <SelectBox value={values.clienteId || ''} disabled={clienteBloccato} onChange={(e) => setField('clienteId', Number(e.target.value))}>
                        <option value="" disabled>Seleziona un cliente…</option>
                        {clienti.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </SelectBox>
                </FormGroup>
                <FormGroup label="Tipo documento">
                    <SelectBox value={values.tipo} disabled={nc} onChange={(e) => setField('tipo', e.target.value as FatturaFormValues['tipo'])}>
                        {(nc ? (['TD04'] as const) : (['TD01', 'TD24'] as const)).map((t) => <option key={t} value={t}>{t} — {TIPO_DOCUMENTO_LABEL[t]}</option>)}
                    </SelectBox>
                </FormGroup>
            </FormRow>
            <FormRow>
                <FormGroup label="Data documento *" error={errors.data}>
                    <InputBox icon="fa-calendar-day" type="date" value={values.data} onChange={(e) => setField('data', e.target.value)} />
                </FormGroup>
                {!nc && (
                    <FormGroup label="Termini di pagamento">
                        <SelectBox value={values.terminiPagamento} onChange={(e) => setField('terminiPagamento', e.target.value)}>
                            {tables.terminiPagamento.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </SelectBox>
                    </FormGroup>
                )}
            </FormRow>
            {!nc && (
                <FormRow>
                    <FormGroup label="Metodo di pagamento">
                        <SelectBox value={values.metodoPagamento} onChange={(e) => setField('metodoPagamento', e.target.value)}>
                            {tables.metodiPagamento.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </SelectBox>
                    </FormGroup>
                </FormRow>
            )}
            <FormRow>
                <div className="form-group--full">
                    <RigheEditor
                        righe={values.righe}
                        prodotti={prodotti}
                        onChange={(righe) => setField('righe', righe)}
                        error={errors.righe}
                        verificaGiacenza={false}
                        totaleLabel={nc ? 'Totale nota di credito' : 'Totale fattura'}
                    />
                </div>
            </FormRow>
            <FormRow>
                <FormGroup label="Note (causale)" full>
                    <TextareaBox rows={2} value={values.note} onChange={(e) => setField('note', e.target.value)} />
                </FormGroup>
            </FormRow>
        </Modal>
    );
}
