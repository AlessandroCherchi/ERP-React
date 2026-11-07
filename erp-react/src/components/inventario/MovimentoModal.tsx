import { useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { ActionButton } from '../ui/Button';
import { FormGroup, FormRow, FormTotal, InputBox, SelectBox, TextareaBox } from '../ui/FormField';
import { useValidatedForm } from '../../lib/validation';
import { movimentoSchema } from '../../lib/schemas/prodotto';
import { formatNumber, parseNum, today } from '../../lib/format';
import type { MovimentoFormValues, MovimentoManuale, Prodotto } from '../../types/prodotto';
import { applicaInMagazzino, giacenzaIn, totaleGiacenze, type Magazzino } from '../../types/magazzino';

interface MovimentoModalProps {
    open: boolean;
    onClose: () => void;
    /** Prodotto su cui registrare il movimento. */
    prodotto: Prodotto | null;
    onSubmit: (values: MovimentoFormValues) => void;
    saving?: boolean;
    /** Magazzini attivi; con uno solo la scelta non viene mostrata. */
    magazzini: Magazzino[];
    magazzinoDefault: number;
}

const EMPTY_MOVIMENTO: MovimentoFormValues = {
    tipo: 'carico',
    magazzinoId: '',
    quantita: '',
    causale: '',
    data: '',
    note: '',
};

/** Causali suggerite per tipo — evitano il campo libero incoerente. */
const CAUSALI: Record<MovimentoManuale, string[]> = {
    carico: ['Ordine fornitore', 'Reso da cliente', 'Produzione interna', 'Trasferimento in entrata'],
    scarico: ['Ordine cliente', 'Reso a fornitore', 'Consumo interno', 'Scarto / danneggiamento'],
    rettifica: ['Inventario fisico', 'Correzione errore di carico', 'Allineamento contabile'],
};

/**
 * Modale "Movimento di magazzino": unico punto da cui la giacenza può
 * cambiare a mano dopo la creazione dell'articolo. Mostra in tempo reale la
 * giacenza risultante nel magazzino scelto, calcolata con applicaInMagazzino()
 * — la stessa funzione usata dall'adapter: anteprima e salvataggio coincidono.
 */
export function MovimentoModal({ open, onClose, prodotto, onSubmit, saving = false, magazzini, magazzinoDefault }: MovimentoModalProps) {
    const { values, errors, setField, validate, reset } = useValidatedForm<MovimentoFormValues>(
        movimentoSchema,
        EMPTY_MOVIMENTO
    );

    useEffect(() => {
        if (open) reset({ ...EMPTY_MOVIMENTO, data: today(), magazzinoId: String(magazzinoDefault) });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    function handleSave() {
        if (!validate()) return;
        onSubmit(values);
    }

    const magazzinoId = Number(values.magazzinoId) || magazzinoDefault;
    const giacenzaAttuale = prodotto ? giacenzaIn(prodotto.giacenze, magazzinoId) : 0;
    const quantita = parseNum(values.quantita);
    const dopo = prodotto ? applicaInMagazzino(prodotto.giacenze, magazzinoId, values.tipo, quantita) : {};
    const giacenzaFinale = giacenzaIn(dopo, magazzinoId);
    const multi = magazzini.length > 1;
    const unita = prodotto?.unita ?? 'pz';

    // Uno scarico superiore alla giacenza verrebbe troncato a 0: meglio
    // avvisare prima del salvataggio che lasciar sparire delle unità.
    const scaricoEccessivo = values.tipo === 'scarico' && quantita > giacenzaAttuale;

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Movimento di Magazzino"
            size="sm"
            footer={
                <>
                    <ActionButton variant="outline" onClick={onClose}>Annulla</ActionButton>
                    <ActionButton icon="fa-check" onClick={handleSave} disabled={saving}>
                        Registra Movimento
                    </ActionButton>
                </>
            }
        >
            {prodotto && (
                <FormRow>
                    <p className="form-hint form-group--full">
                        <strong>{prodotto.nome}</strong> — {prodotto.sku}
                        <br />
                        Giacenza {multi ? 'nel magazzino' : 'attuale'}: {formatNumber(giacenzaAttuale)} {unita}
                        {multi && <> · totale {formatNumber(prodotto.giacenza)} {unita}</>}
                    </p>
                </FormRow>
            )}

            {multi && (
                <FormRow>
                    <FormGroup label="Magazzino" full error={errors.magazzinoId}>
                        <SelectBox value={values.magazzinoId} onChange={(e) => setField('magazzinoId', e.target.value)}>
                            {magazzini.map((m) => <option key={m.id} value={m.id}>{m.codice} — {m.nome}</option>)}
                        </SelectBox>
                    </FormGroup>
                </FormRow>
            )}

            <FormRow>
                <FormGroup label="Tipo movimento" full>
                    <SelectBox
                        value={values.tipo}
                        onChange={(e) => {
                            // cambiando tipo la causale suggerita non è più
                            // pertinente: la si azzera invece di trascinarla
                            setField('tipo', e.target.value as MovimentoManuale);
                            setField('causale', '');
                        }}
                    >
                        <option value="carico">Carico — merce in ingresso</option>
                        <option value="scarico">Scarico — merce in uscita</option>
                        <option value="rettifica">Rettifica — allineamento inventario</option>
                    </SelectBox>
                </FormGroup>
            </FormRow>

            <FormRow>
                <FormGroup
                    label={values.tipo === 'rettifica' ? `Giacenza reale (${unita}) *` : `Quantità (${unita}) *`}
                    error={errors.quantita}
                >
                    <InputBox
                        icon={values.tipo === 'scarico' ? 'fa-arrow-down' : values.tipo === 'carico' ? 'fa-arrow-up' : 'fa-scale-balanced'}
                        type="number"
                        min={0}
                        step={1}
                        placeholder="0"
                        value={values.quantita}
                        onChange={(e) => setField('quantita', e.target.value)}
                    />
                </FormGroup>
                <FormGroup label="Data *" error={errors.data}>
                    <InputBox
                        icon="fa-calendar-day"
                        type="date"
                        value={values.data}
                        onChange={(e) => setField('data', e.target.value)}
                    />
                </FormGroup>
            </FormRow>

            <FormRow>
                <FormGroup label="Causale *" error={errors.causale} full>
                    <SelectBox value={values.causale} onChange={(e) => setField('causale', e.target.value)}>
                        <option value="">Seleziona una causale…</option>
                        {CAUSALI[values.tipo].map((c) => (
                            <option value={c} key={c}>{c}</option>
                        ))}
                    </SelectBox>
                </FormGroup>
            </FormRow>

            <FormRow>
                <FormTotal
                    label={multi ? 'Giacenza risultante nel magazzino' : 'Giacenza risultante'}
                    value={`${formatNumber(giacenzaFinale)} ${unita}${multi ? ` (totale ${formatNumber(totaleGiacenze(dopo))})` : ''}`}
                />
            </FormRow>

            {scaricoEccessivo && (
                <FormRow>
                    <p className="form-hint form-hint--warning form-group--full">
                        <i className="fa-solid fa-triangle-exclamation" /> Lo scarico supera la giacenza
                        disponibile: verranno scaricate solo {formatNumber(giacenzaAttuale)} {unita}.
                    </p>
                </FormRow>
            )}

            <FormRow>
                <FormGroup label="Note" full>
                    <TextareaBox
                        rows={2}
                        placeholder="Riferimento documento, note operative..."
                        value={values.note}
                        onChange={(e) => setField('note', e.target.value)}
                    />
                </FormGroup>
            </FormRow>
        </Modal>
    );
}
