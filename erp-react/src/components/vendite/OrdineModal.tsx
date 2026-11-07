import { useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { ActionButton } from '../ui/Button';
import { FormGroup, FormRow, InputBox, SelectBox, TextareaBox } from '../ui/FormField';
import { RigheEditor } from '../documenti/RigheEditor';
import { useValidatedForm } from '../../lib/validation';
import { ordineSchema } from '../../lib/schemas/ordine';
import { today } from '../../lib/format';
import {
    EMPTY_ORDINE_FORM, PRIORITA_OPTIONS,
    type Ordine, type OrdineFormValues, type OrdinePriorita,
} from '../../types/ordine';
import type { ClienteRef } from '../../types/cliente';
import type { Prodotto } from '../../types/prodotto';

interface OrdineModalProps {
    open: boolean;
    onClose: () => void;
    /** null = nuovo ordine, Ordine = modifica (ammessa solo sulle bozze). */
    editing: Ordine | null;
    onSubmit: (values: OrdineFormValues) => void;
    saving: boolean;
    clienti: ClienteRef[];
    prodotti: Prodotto[];
    /** Numero documento proposto per un nuovo ordine. */
    numeroSuggerito: string;
}

/** Ordine (dal server) → valori del form. */
function toFormValues(o: Ordine): OrdineFormValues {
    return {
        numero: o.numero,
        clienteId: o.clienteId,
        data: o.data,
        consegna: o.consegna,
        priorita: o.priorita,
        righe: o.righe.map((r) => ({ ...r })),
        note: o.note,
    };
}

/**
 * Modale Nuovo/Modifica Ordine — condiviso fra la pagina Vendite e la quick
 * action della Dashboard, come ClientModal e ProdottoModal.
 *
 * Non c'è una <select> "stato iniziale": un ordine nasce sempre in bozza e
 * la conferma è un'azione a sé, perché è quella che scarica il magazzino e
 * può fallire (vedi lib/mockApi/ordini.ts → createOrdine).
 */
export function OrdineModal({
    open, onClose, editing, onSubmit, saving, clienti, prodotti, numeroSuggerito,
}: OrdineModalProps) {
    const { values, errors, setField, validate, reset } = useValidatedForm<OrdineFormValues>(
        ordineSchema,
        EMPTY_ORDINE_FORM
    );

    useEffect(() => {
        if (!open) return;
        reset(
            editing
                ? toFormValues(editing)
                : { ...EMPTY_ORDINE_FORM, numero: numeroSuggerito, data: today() }
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, editing]);

    /**
     * Opzioni cliente. Un ordine intestato a un cliente diventato inattivo
     * continua a mostrarlo: senza questa riga la select non troverebbe il
     * valore corrente e lo azzererebbe in silenzio al primo salvataggio
     * (stessa cura del campo Fornitore nel modale prodotto).
     */
    const opzioniClienti = useMemo<ClienteRef[]>(() => {
        if (!editing || clienti.some((c) => c.id === editing.clienteId)) return clienti;
        return [{ id: editing.clienteId, nome: editing.cliente }, ...clienti];
    }, [clienti, editing]);

    function handleSave() {
        if (!validate()) return;
        onSubmit(values);
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={editing ? `Modifica Ordine ${editing.numero}` : 'Nuovo Ordine'}
            footer={
                <>
                    <ActionButton variant="outline" onClick={onClose}>Annulla</ActionButton>
                    <ActionButton icon="fa-check" onClick={handleSave} disabled={saving}>
                        {editing ? 'Salva Modifiche' : 'Crea Bozza'}
                    </ActionButton>
                </>
            }
        >
            <FormRow>
                <FormGroup label="Cliente *" error={errors.clienteId}>
                    <SelectBox
                        value={String(values.clienteId)}
                        onChange={(e) => setField('clienteId', Number(e.target.value))}
                    >
                        <option value="0">Seleziona un cliente…</option>
                        {opzioniClienti.map((c) => (
                            <option value={c.id} key={c.id}>{c.nome}</option>
                        ))}
                    </SelectBox>
                </FormGroup>
                <FormGroup label="Numero documento *" error={errors.numero}>
                    <InputBox
                        icon="fa-hashtag"
                        placeholder="ORD-3097"
                        value={values.numero}
                        onChange={(e) => setField('numero', e.target.value)}
                    />
                </FormGroup>
            </FormRow>

            <FormRow>
                <FormGroup label="Data ordine *" error={errors.data}>
                    <InputBox
                        icon="fa-calendar-day"
                        type="date"
                        value={values.data}
                        onChange={(e) => setField('data', e.target.value)}
                    />
                </FormGroup>
                <FormGroup label="Consegna prevista" error={errors.consegna}>
                    <InputBox
                        icon="fa-truck-fast"
                        type="date"
                        value={values.consegna}
                        onChange={(e) => setField('consegna', e.target.value)}
                    />
                </FormGroup>
            </FormRow>

            <FormRow>
                <FormGroup label="Priorità">
                    <SelectBox
                        value={values.priorita}
                        onChange={(e) => setField('priorita', e.target.value as OrdinePriorita)}
                    >
                        {PRIORITA_OPTIONS.map((p) => (
                            <option value={p.value} key={p.value}>{p.label}</option>
                        ))}
                    </SelectBox>
                </FormGroup>
                <FormGroup label="Stato">
                    <p className="form-hint form-hint--static">
                        {editing
                            ? 'La modifica è ammessa solo sulle bozze: per cambiare un ordine confermato si annulla e si riemette.'
                            : "L'ordine nasce in bozza. La conferma — che scarica il magazzino — si dà dal dettaglio."}
                    </p>
                </FormGroup>
            </FormRow>

            <FormRow>
                <div className="form-group--full">
                    <RigheEditor totaleLabel="Totale ordine"
                        righe={values.righe}
                        prodotti={prodotti}
                        onChange={(righe) => setField('righe', righe)}
                        error={errors.righe}
                    />
                </div>
            </FormRow>

            <FormRow>
                <FormGroup label="Note" full>
                    <TextareaBox
                        rows={2}
                        placeholder="Condizioni, riferimenti interni, istruzioni di spedizione..."
                        value={values.note}
                        onChange={(e) => setField('note', e.target.value)}
                    />
                </FormGroup>
            </FormRow>
        </Modal>
    );
}
