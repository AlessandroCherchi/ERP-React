import {
    DetailField, DetailHeader, DetailPanelShell, DetailSection, DetailStat, PanelActions, type PanelAction,
} from '../ui/DetailPanelShell';
import { formatEuro } from '../../lib/format';
import { STATO_CLIENTE_LABEL, type Cliente } from '../../types/cliente';
import type { StatisticheCliente } from '../../types/statistiche';

interface ClientDetailPanelProps {
    cliente: Cliente | null;
    /** Indicatori derivati da ordini, fatture e incassi. */
    stats: StatisticheCliente;
    open: boolean;
    onClose: () => void;
    actions: PanelAction[];
}

/** Pannello dettaglio cliente: anagrafica, dati fiscali, panoramica economica. */
export function ClientDetailPanel({ cliente, stats, open, onClose, actions }: ClientDetailPanelProps) {
    return (
        <DetailPanelShell open={open} title="Dettaglio Cliente" onClose={onClose} footer={<PanelActions actions={actions} />}>
            {cliente && (
                <div className="detail-panel-body">
                    <DetailHeader
                        icon="fa-user"
                        name={cliente.nome}
                        status={{ className: cliente.stato, label: STATO_CLIENTE_LABEL[cliente.stato] }}
                    />

                    <DetailSection title="Informazioni di Contatto">
                        <div className="detail-grid">
                            <DetailField label="Email" value={cliente.email} />
                            <DetailField label="Telefono" value={cliente.telefono} />
                            <DetailField label="Indirizzo" value={cliente.indirizzo} />
                            <DetailField label="Città" value={cliente.citta ? `${cliente.citta}${cliente.provincia ? ` (${cliente.provincia})` : ''}` : ''} />
                        </div>
                    </DetailSection>

                    <DetailSection title="Dati Aziendali">
                        <div className="detail-grid">
                            <DetailField label="P.IVA" value={cliente.piva} />
                            <DetailField label="Cod. Fiscale" value={cliente.cf} />
                            <DetailField label="PEC" value={cliente.pec} />
                            <DetailField label="SDI" value={cliente.sdi} />
                        </div>
                    </DetailSection>

                    <DetailSection title="Panoramica Economica">
                        <div className="detail-stats-row">
                            <DetailStat label="Fatturato" value={formatEuro(stats.fatturato, 0)} />
                            <DetailStat label="Ordini" value={stats.ordini} />
                            <DetailStat label="Credito" value={formatEuro(stats.credito, 0)} />
                        </div>
                    </DetailSection>

                    <DetailSection title="Note">
                        <p className="detail-notes">{cliente.note || 'Nessuna nota disponibile.'}</p>
                    </DetailSection>
                </div>
            )}
        </DetailPanelShell>
    );
}
