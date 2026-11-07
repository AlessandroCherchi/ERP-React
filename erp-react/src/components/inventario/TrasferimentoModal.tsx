import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { ActionButton } from '../ui/Button';
import { FormGroup, FormRow, InputBox, SelectBox } from '../ui/FormField';
import { formatNumber, parseNum, today } from '../../lib/format';
import { giacenzaIn, type Magazzino } from '../../types/magazzino';
import type { Prodotto } from '../../types/prodotto';

interface TrasferimentoModalProps {
    prodotto: Prodotto | null;
    magazzini: Magazzino[];
    onClose: () => void;
    onSubmit: (v: { da: number; a: number; quantita: number; data: string; note: string }) => void;
    saving: boolean;
}

/** Trasferimento fra magazzini: propone come origine il magazzino con più merce. */
export function TrasferimentoModal({ prodotto, magazzini, onClose, onSubmit, saving }: TrasferimentoModalProps) {
    const origineDefault = prodotto
        ? [...magazzini].sort((x, y) => giacenzaIn(prodotto.giacenze, y.id) - giacenzaIn(prodotto.giacenze, x.id))[0]?.id ?? 0
        : 0;
    const [da, setDa] = useState(origineDefault);
    const [a, setA] = useState(() => magazzini.find((m) => m.id !== origineDefault)?.id ?? 0);
    const [quantita, setQuantita] = useState('');
    const [data, setData] = useState(today);
    const [note, setNote] = useState('');

    const disponibile = prodotto ? giacenzaIn(prodotto.giacenze, da) : 0;
    const q = parseNum(quantita);
    const errore = da === a ? 'Origine e destinazione coincidono' : q <= 0 ? '' : q > disponibile ? `Disponibili ${formatNumber(disponibile)}` : '';

    return (
        <Modal
            open={prodotto != null}
            onClose={onClose}
            title={prodotto ? `Trasferisci — ${prodotto.nome}` : ''}
            size="sm"
            footer={
                <>
                    <ActionButton variant="outline" onClick={onClose}>Annulla</ActionButton>
                    <ActionButton icon="fa-arrows-left-right-to-line" disabled={saving || Boolean(errore) || q <= 0} onClick={() => onSubmit({ da, a, quantita: q, data, note })}>Trasferisci</ActionButton>
                </>
            }
        >
            {prodotto && (
                <>
                    <FormRow>
                        <FormGroup label="Da">
                            <SelectBox value={da} onChange={(e) => setDa(Number(e.target.value))}>
                                {magazzini.map((m) => <option key={m.id} value={m.id}>{m.nome} ({formatNumber(giacenzaIn(prodotto.giacenze, m.id))} {prodotto.unita})</option>)}
                            </SelectBox>
                        </FormGroup>
                        <FormGroup label="A" error={da === a ? errore : undefined}>
                            <SelectBox value={a} onChange={(e) => setA(Number(e.target.value))}>
                                {magazzini.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                            </SelectBox>
                        </FormGroup>
                    </FormRow>
                    <FormRow>
                        <FormGroup label={`Quantità (${prodotto.unita})`} error={da !== a ? errore || undefined : undefined}>
                            <InputBox icon="fa-hashtag" type="number" min={0} value={quantita} onChange={(e) => setQuantita(e.target.value)} />
                        </FormGroup>
                        <FormGroup label="Data">
                            <InputBox icon="fa-calendar-day" type="date" value={data} onChange={(e) => setData(e.target.value)} />
                        </FormGroup>
                    </FormRow>
                    <FormRow>
                        <FormGroup label="Note" full>
                            <InputBox icon="fa-note-sticky" value={note} onChange={(e) => setNote(e.target.value)} />
                        </FormGroup>
                    </FormRow>
                </>
            )}
        </Modal>
    );
}
