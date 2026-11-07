import { useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { ActionButton } from '../../ui/Button';
import { FormGroup, FormRow, FormTotal, InputBox, SelectBox, TextareaBox } from '../../ui/FormField';
import { useValidatedForm } from '../../../lib/validation';
import { fatturaSchema } from '../../../lib/schemas/quickActions';
import { formatEuro, parseNum } from '../../../lib/format';
import { EMPTY_FATTURA, type FatturaForm } from '../../../types/quickActions';

interface FatturaModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: FatturaForm) => void;
    defaults: Partial<FatturaForm>;
    clientiNomi: string[];
}

/** Modale "Nuova Fattura" — porting 1:1 di #modalFattura in dashboard.html (totale live). */
export function FatturaModal({ open, onClose, onSubmit, defaults, clientiNomi }: FatturaModalProps) {
    const { values, errors, setField, validate, reset } = useValidatedForm<FatturaForm>(fatturaSchema, EMPTY_FATTURA);

    useEffect(() => {
        if (open) reset({ ...EMPTY_FATTURA, ...defaults });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    function handleSave() {
        if (!validate()) return;
        onSubmit(values);
    }

    const totale = parseNum(values.imponibile) + (parseNum(values.imponibile) * parseNum(values.iva)) / 100;

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Nuova Fattura"
            footer={
                <>
                    <ActionButton variant="outline" onClick={onClose}>Annulla</ActionButton>
                    <ActionButton icon="fa-check" onClick={handleSave}>Emetti Fattura</ActionButton>
                </>
            }
        >
            <FormRow>
                <FormGroup label="Cliente *" error={errors.cliente}>
                    <SelectBox value={values.cliente} onChange={(e) => setField('cliente', e.target.value)}>
                        <option value="" disabled>Seleziona un cliente…</option>
                        {clientiNomi.map((n) => <option key={n} value={n}>{n}</option>)}
                    </SelectBox>
                </FormGroup>
                <FormGroup label="Numero documento *" error={errors.numero}>
                    <InputBox icon="fa-file-invoice" placeholder="2026/0142" value={values.numero}
                        onChange={(e) => setField('numero', e.target.value)} />
                </FormGroup>
            </FormRow>

            <FormRow>
                <FormGroup label="Tipo documento">
                    <SelectBox value={values.tipo} onChange={(e) => setField('tipo', e.target.value)}>
                        <option value="fattura">Fattura immediata</option>
                        <option value="differita">Fattura differita</option>
                        <option value="acconto">Fattura di acconto</option>
                        <option value="nota-credito">Nota di credito</option>
                    </SelectBox>
                </FormGroup>
                <FormGroup label="Data emissione *" error={errors.data}>
                    <InputBox icon="fa-calendar-day" type="date" value={values.data}
                        onChange={(e) => setField('data', e.target.value)} />
                </FormGroup>
            </FormRow>

            <FormRow>
                <FormGroup label="Termini di pagamento">
                    <SelectBox value={values.scadenza} onChange={(e) => setField('scadenza', e.target.value)}>
                        <option value="30">30 giorni data fattura</option>
                        <option value="60">60 giorni data fattura</option>
                        <option value="90">90 giorni data fattura</option>
                        <option value="0">Pagamento immediato</option>
                    </SelectBox>
                </FormGroup>
                <FormGroup label="Metodo di pagamento">
                    <SelectBox value={values.pagamento} onChange={(e) => setField('pagamento', e.target.value)}>
                        <option value="bonifico">Bonifico bancario</option>
                        <option value="riba">RIBA</option>
                        <option value="carta">Carta di credito</option>
                        <option value="contanti">Contanti</option>
                    </SelectBox>
                </FormGroup>
            </FormRow>

            <FormRow>
                <FormGroup label="Imponibile (€) *" error={errors.imponibile}>
                    <InputBox icon="fa-euro-sign" type="number" min={0} step={0.01} placeholder="1500.00"
                        value={values.imponibile} onChange={(e) => setField('imponibile', e.target.value)} />
                </FormGroup>
                <FormGroup label="Aliquota IVA">
                    <SelectBox value={values.iva} onChange={(e) => setField('iva', e.target.value)}>
                        <option value="22">22% — ordinaria</option>
                        <option value="10">10% — ridotta</option>
                        <option value="4">4% — minima</option>
                        <option value="0">0% — esente / non imponibile</option>
                    </SelectBox>
                </FormGroup>
            </FormRow>

            <FormRow>
                <FormTotal label="Totale documento" value={formatEuro(totale)} />
            </FormRow>

            <FormRow>
                <FormGroup label="Note" full>
                    <TextareaBox rows={3} placeholder="Riferimento ordine, causale, note in fattura..."
                        value={values.note} onChange={(e) => setField('note', e.target.value)} />
                </FormGroup>
            </FormRow>
        </Modal>
    );
}
