import { useMemo, useState } from 'react';
import { Modal } from '../ui/Modal';
import { ActionButton } from '../ui/Button';
import { FormGroup, FormRow, SelectBox } from '../ui/FormField';
import { formatDate, formatEuro } from '../../lib/format';
import { totaliOrdine, type Ordine } from '../../types/ordine';

interface DaOrdiniModalProps {
    open: boolean;
    onClose: () => void;
    /** Ordini consegnati e non ancora fatturati. */
    ordini: Ordine[];
    onConfirm: (clienteId: number, ordini: Ordine[]) => void;
}

/**
 * Fatturazione da ordini consegnati: si sceglie il cliente e gli ordini da
 * includere. Un ordine solo → fattura immediata (TD01); più ordini →
 * differita (TD24), come da prassi.
 */
export function DaOrdiniModal({ open, onClose, ordini, onConfirm }: DaOrdiniModalProps) {
    const clienti = useMemo(() => {
        const m = new Map<number, string>();
        for (const o of ordini) m.set(o.clienteId, o.cliente);
        return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
    }, [ordini]);
    const [clienteId, setClienteId] = useState(0);
    const [scelti, setScelti] = useState<number[]>([]);

    const suoi = ordini.filter((o) => o.clienteId === clienteId);
    const selezionati = suoi.filter((o) => scelti.includes(o.id));

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Fattura da ordini consegnati"
            footer={
                <>
                    <ActionButton variant="outline" onClick={onClose}>Annulla</ActionButton>
                    <ActionButton icon="fa-file-invoice" disabled={selezionati.length === 0} onClick={() => onConfirm(clienteId, selezionati)}>
                        Prepara bozza ({selezionati.length})
                    </ActionButton>
                </>
            }
        >
            {clienti.length === 0 ? (
                <div className="empty-state"><i className="fa-solid fa-circle-check" /><p>Tutti gli ordini consegnati risultano fatturati.</p></div>
            ) : (
                <>
                    <FormRow>
                        <FormGroup label="Cliente" full>
                            <SelectBox value={clienteId || ''} onChange={(e) => { const id = Number(e.target.value); setClienteId(id); setScelti(ordini.filter((o) => o.clienteId === id).map((o) => o.id)); }}>
                                <option value="" disabled>Seleziona un cliente…</option>
                                {clienti.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
                            </SelectBox>
                        </FormGroup>
                    </FormRow>
                    <ul className="check-list">
                        {suoi.map((o) => (
                            <li key={o.id}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={scelti.includes(o.id)}
                                        onChange={(e) => setScelti((s) => (e.target.checked ? [...s, o.id] : s.filter((x) => x !== o.id)))}
                                    />
                                    <span><strong>{o.numero}</strong> del {formatDate(o.data)} — consegnato {formatDate(o.consegna)}</span>
                                    <em>{formatEuro(totaliOrdine(o.righe).totale)}</em>
                                </label>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </Modal>
    );
}
