import { DetailField, DetailHeader, DetailPanelShell, DetailSection, PanelActions, type PanelAction } from '../ui/DetailPanelShell';
import { RigheList, StatoActions, TotaliBlock, type StatoAction } from '../documenti/DocumentoParts';
import { formatDate, formatNumber } from '../../lib/format';
import { acquistoInRitardo, STATO_ACQUISTO_LABEL, type OrdineAcquisto } from '../../types/acquisto';

interface AcquistoDetailPanelProps {
    ordine: OrdineAcquisto | null;
    open: boolean;
    oggi: string;
    onClose: () => void;
    actions: PanelAction[];
    /** Azioni di ciclo di vita già filtrate per stato e permesso. */
    statoActions: StatoAction[];
    busy: boolean;
}

const NOTA: Record<OrdineAcquisto['stato'], string> = {
    bozza: 'In bozza l’ordine non è ancora stato inviato al fornitore e non impegna nulla.',
    inviato: 'In attesa di consegna. Al ricevimento la merce viene caricata a magazzino.',
    parziale: 'Consegna parziale: le righe con residuo restano in attesa.',
    ricevuto: 'Merce interamente ricevuta e caricata a magazzino.',
    annullato: 'Ordine annullato.',
};

/** Dettaglio ordine d'acquisto: testata, righe con avanzamento, totali, azioni. */
export function AcquistoDetailPanel({ ordine, open, oggi, onClose, actions, statoActions, busy }: AcquistoDetailPanelProps) {
    return (
        <DetailPanelShell open={open} title="Ordine d’Acquisto" onClose={onClose} footer={<PanelActions actions={actions} />}>
            {ordine && (
                <div className="detail-panel-body">
                    <DetailHeader icon="fa-cart-flatbed" name={ordine.numero} status={{ className: ordine.stato, label: STATO_ACQUISTO_LABEL[ordine.stato] }} />

                    <DetailSection title="Testata">
                        <div className="detail-grid">
                            <DetailField label="Fornitore" value={ordine.fornitore} />
                            <DetailField label="Data" value={formatDate(ordine.data)} />
                            <DetailField
                                label="Consegna prevista"
                                value={ordine.consegna ? `${formatDate(ordine.consegna)}${acquistoInRitardo(ordine, oggi) ? ' — in ritardo' : ''}` : ''}
                            />
                        </div>
                    </DetailSection>

                    <RigheList
                        righe={ordine.righe}
                        tone="carico"
                        icon="fa-arrow-down"
                        progress={ordine.stato === 'bozza' ? undefined : (r) => ({
                            done: r.quantita ? r.ricevuta / r.quantita : 0,
                            label: `ricevuti ${formatNumber(r.ricevuta)} / ${formatNumber(r.quantita)} ${r.unita}`,
                        })}
                    />
                    <TotaliBlock righe={ordine.righe} />

                    <StatoActions
                        title="Avanzamento"
                        note={NOTA[ordine.stato]}
                        actions={statoActions}
                        busy={busy}
                        emptyText="Nessuna azione disponibile."
                    />

                    <DetailSection title="Note">
                        <p className="detail-notes">{ordine.note || 'Nessuna nota.'}</p>
                    </DetailSection>
                </div>
            )}
        </DetailPanelShell>
    );
}
