import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { ActionButton } from '../ui/Button';
import { FormGroup, FormRow, InputBox } from '../ui/FormField';
import { formatEuro, formatNumber, today } from '../../lib/format';
import { costoNettoUnitario, residuo, type OrdineAcquisto } from '../../types/acquisto';

interface RicevimentoModalProps {
    ordine: OrdineAcquisto | null;
    onClose: () => void;
    onSubmit: (data: string, quantita: number[]) => void;
    saving: boolean;
}

/**
 * Registrazione del ricevimento merce. Propone il residuo di ogni riga
 * (il caso normale è "arrivato tutto"); l'operatore corregge le righe
 * consegnate solo in parte. Ogni quantità diventa un carico di magazzino.
 */
export function RicevimentoModal({ ordine, onClose, onSubmit, saving }: RicevimentoModalProps) {
    // Stato iniziale dal documento: il chiamante rimonta il modale per ogni
    // ordine (key), così non serve riallineare lo stato in un effect.
    const [data, setData] = useState(today);
    const [quantita, setQuantita] = useState<number[]>(() => ordine?.righe.map(residuo) ?? []);

    const invalid = !ordine || quantita.every((q) => q === 0)
        || quantita.some((q, i) => q < 0 || q > residuo(ordine.righe[i]!));

    return (
        <Modal
            open={ordine != null}
            onClose={onClose}
            title={ordine ? `Ricevimento merce — ${ordine.numero}` : ''}
            footer={
                <>
                    <ActionButton variant="outline" onClick={onClose}>Annulla</ActionButton>
                    <ActionButton icon="fa-dolly" disabled={invalid || saving} onClick={() => onSubmit(data, quantita)}>Carica a magazzino</ActionButton>
                </>
            }
        >
            {ordine && (
                <>
                    <FormRow>
                        <FormGroup label="Data ricevimento">
                            <InputBox icon="fa-calendar-day" type="date" value={data} max={today()} onChange={(e) => setData(e.target.value)} />
                        </FormGroup>
                        <FormGroup label="Fornitore">
                            <InputBox icon="fa-truck-field" value={ordine.fornitore} readOnly />
                        </FormGroup>
                    </FormRow>
                    <ul className="righe-list ricevimento-list">
                        <li className="riga-item riga-item--head ricevimento-row" aria-hidden="true">
                            <span>Articolo</span><span>Ordinato</span><span>Già ricevuto</span><span>Ricevo ora</span>
                        </li>
                        {ordine.righe.map((r, i) => {
                            const max = residuo(r);
                            return (
                                <li key={r.prodottoId} className="riga-item ricevimento-row">
                                    <div className="riga-prod">
                                        <span className="riga-nome">{r.nome}</span>
                                        <span className="riga-sku">{r.sku} · costo {formatEuro(costoNettoUnitario(r))}</span>
                                    </div>
                                    <span>{formatNumber(r.quantita)} {r.unita}</span>
                                    <span>{formatNumber(r.ricevuta)} {r.unita}</span>
                                    <input
                                        className="riga-input"
                                        type="number"
                                        min={0}
                                        max={max}
                                        disabled={max === 0}
                                        aria-label={`Quantità ricevuta ${r.nome}`}
                                        value={String(quantita[i] ?? 0)}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => {
                                            const n = Math.min(max, Math.max(0, Number(e.target.value) || 0));
                                            setQuantita((qs) => qs.map((q, j) => (j === i ? n : q)));
                                        }}
                                    />
                                </li>
                            );
                        })}
                    </ul>
                    <p className="form-hint--static">
                        Il costo medio ponderato degli articoli viene ricalcolato con il costo d’acquisto di riga.
                    </p>
                </>
            )}
        </Modal>
    );
}
