import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { ActionButton } from '../ui/Button';
import { FormGroup, FormRow, InputBox, SelectBox } from '../ui/FormField';
import { useConfig } from '../../config/configStore';
import { formatEuro, parseNum, today } from '../../lib/format';

interface IncassoModalProps {
    /** Documento da incassare; null = modale chiuso. Rimontare con key per ogni documento. */
    target: { numero: string; residuo: number; metodo: string } | null;
    onClose: () => void;
    onSubmit: (v: { data: string; importo: number; metodo: string; note: string }) => void;
}

/** Registrazione di un incasso, proposto al residuo (caso tipico: saldo). */
export function IncassoModal({ target, onClose, onSubmit }: IncassoModalProps) {
    const { tables } = useConfig();
    const [data, setData] = useState(today);
    const [importo, setImporto] = useState(() => String(target?.residuo ?? ''));
    const [metodo, setMetodo] = useState(() => target?.metodo ?? 'bonifico');
    const [note, setNote] = useState('');

    const valore = parseNum(importo);
    const errore = !target ? '' : valore <= 0 ? 'Importo non valido' : valore > target.residuo + 1e-9 ? `Massimo ${formatEuro(target.residuo)}` : '';

    return (
        <Modal
            open={target != null}
            onClose={onClose}
            title={target ? `Incasso — fattura ${target.numero}` : ''}
            size="sm"
            footer={
                <>
                    <ActionButton variant="outline" onClick={onClose}>Annulla</ActionButton>
                    <ActionButton icon="fa-check" disabled={Boolean(errore)} onClick={() => onSubmit({ data, importo: valore, metodo, note })}>Registra</ActionButton>
                </>
            }
        >
            <FormRow>
                <FormGroup label="Data incasso">
                    <InputBox icon="fa-calendar-day" type="date" value={data} max={today()} onChange={(e) => setData(e.target.value)} />
                </FormGroup>
                <FormGroup label="Importo (€)" error={errore || undefined}>
                    <InputBox icon="fa-euro-sign" type="number" min={0} step={0.01} value={importo} onChange={(e) => setImporto(e.target.value)} />
                </FormGroup>
            </FormRow>
            <FormRow>
                <FormGroup label="Metodo">
                    <SelectBox value={metodo} onChange={(e) => setMetodo(e.target.value)}>
                        {tables.metodiPagamento.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </SelectBox>
                </FormGroup>
                <FormGroup label="Note">
                    <InputBox icon="fa-note-sticky" value={note} onChange={(e) => setNote(e.target.value)} />
                </FormGroup>
            </FormRow>
        </Modal>
    );
}
