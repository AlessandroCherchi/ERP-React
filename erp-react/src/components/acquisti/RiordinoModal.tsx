import { Modal } from '../ui/Modal';
import { ActionButton } from '../ui/Button';
import { formatEuro, formatNumber } from '../../lib/format';
import type { PropostaRiordino } from '../../types/acquisto';

interface RiordinoModalProps {
    open: boolean;
    proposte: PropostaRiordino[];
    nomeFornitore: (id: number) => string;
    onClose: () => void;
    onConfirm: () => void;
    saving: boolean;
}

/**
 * Riordino suggerito: per ogni fornitore, gli articoli sotto scorta con la
 * quantità che riporta la disponibilità a 2 × scorta (al netto della merce
 * già in arrivo). Conferma = una bozza d'ordine per fornitore.
 */
export function RiordinoModal({ open, proposte, nomeFornitore, onClose, onConfirm, saving }: RiordinoModalProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Riordino suggerito"
            footer={
                <>
                    <ActionButton variant="outline" onClick={onClose}>Chiudi</ActionButton>
                    {proposte.length > 0 && (
                        <ActionButton icon="fa-wand-magic-sparkles" disabled={saving} onClick={onConfirm}>
                            Crea {proposte.length} {proposte.length === 1 ? 'bozza' : 'bozze'}
                        </ActionButton>
                    )}
                </>
            }
        >
            {proposte.length === 0 ? (
                <div className="empty-state">
                    <i className="fa-solid fa-circle-check" />
                    <p>Nessun articolo da riordinare: scorte coperte o merce già in arrivo.</p>
                </div>
            ) : (
                proposte.map((p) => (
                    <section key={p.fornitoreId} className="riordino-group">
                        <h4><i className="fa-solid fa-truck-field" /> {nomeFornitore(p.fornitoreId)}</h4>
                        <ul className="movement-list">
                            {p.righe.map(({ prodotto, quantita }) => (
                                <li key={prodotto.id} className="movement-item">
                                    <div className="movement-icon movement-icon--carico"><i className="fa-solid fa-arrow-down" /></div>
                                    <div className="movement-text">
                                        <strong>{prodotto.nome}</strong>
                                        <span>{prodotto.sku} — giacenza {formatNumber(prodotto.giacenza)} / scorta {formatNumber(prodotto.scorta)} {prodotto.unita}</span>
                                    </div>
                                    <div className="movement-qty movement-qty--carico">+{formatNumber(quantita)}</div>
                                </li>
                            ))}
                        </ul>
                        <p className="riordino-total">
                            Valore stimato: {formatEuro(p.righe.reduce((s, r) => s + r.quantita * r.prodotto.costo, 0))}
                        </p>
                    </section>
                ))
            )}
        </Modal>
    );
}
