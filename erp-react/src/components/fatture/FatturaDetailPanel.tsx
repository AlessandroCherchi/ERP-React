import { DetailField, DetailHeader, DetailPanelShell, DetailSection, DetailStat, PanelActions, type PanelAction } from '../ui/DetailPanelShell';
import { RigheList, StatoActions, TotaliBlock, type StatoAction } from '../documenti/DocumentoParts';
import { formatDate, formatEuro } from '../../lib/format';
import { labelPagamento } from '../../types/fornitore';
import {
    isNotaCredito, STATO_PAGAMENTO_LABEL, STATO_SDI_LABEL, TIPO_DOCUMENTO_LABEL,
    type Fattura, type Incasso, type Situazione,
} from '../../types/fattura';

interface FatturaDetailPanelProps {
    fattura: Fattura | null;
    situazione: Situazione | null;
    incassi: Incasso[];
    /** Numero della fattura d'origine (per le note di credito). */
    origine?: string;
    open: boolean;
    onClose: () => void;
    actions: PanelAction[];
    statoActions: StatoAction[];
    onEliminaIncasso?: (id: number) => void;
    busy: boolean;
}

/** Dettaglio documento: cessionario, righe, IVA, SDI, pagamenti. */
export function FatturaDetailPanel({ fattura: f, situazione: s, incassi, origine, open, onClose, actions, statoActions, onEliminaIncasso, busy }: FatturaDetailPanelProps) {
    return (
        <DetailPanelShell open={open} title={f ? TIPO_DOCUMENTO_LABEL[f.tipo] : ''} onClose={onClose} footer={<PanelActions actions={actions} />}>
            {f && (
                <div className="detail-panel-body">
                    <DetailHeader
                        icon={isNotaCredito(f) ? 'fa-file-circle-minus' : 'fa-file-invoice-dollar'}
                        name={f.numero ?? 'Bozza'}
                        status={f.stato === 'bozza' ? { className: 'bozza', label: 'Bozza' } : { className: f.sdi, label: `SDI: ${STATO_SDI_LABEL[f.sdi]}` }}
                    />

                    <DetailSection title="Cessionario">
                        <div className="detail-grid">
                            <DetailField label="Ragione sociale" value={f.cliente.nome} />
                            <DetailField label="P.IVA / C.F." value={[f.cliente.piva, f.cliente.cf].filter(Boolean).join(' · ')} />
                            <DetailField label="Indirizzo" value={[f.cliente.indirizzo, f.cliente.citta && `${f.cliente.citta} (${f.cliente.provincia})`].filter(Boolean).join(', ')} />
                            <DetailField label="Recapito SDI" value={f.cliente.sdi || f.cliente.pec || '— (cassetto fiscale)'} />
                        </div>
                    </DetailSection>

                    <DetailSection title="Documento">
                        <div className="detail-grid">
                            <DetailField label="Tipo" value={`${f.tipo} — ${TIPO_DOCUMENTO_LABEL[f.tipo]}`} />
                            <DetailField label="Data" value={formatDate(f.data)} />
                            {!isNotaCredito(f) && <DetailField label="Pagamento" value={labelPagamento(f.terminiPagamento)} />}
                            {origine && <DetailField label="Storna la fattura" value={origine} />}
                        </div>
                    </DetailSection>

                    <RigheList righe={f.righe} icon="fa-file-lines" tone="rettifica" />
                    <TotaliBlock righe={f.righe} />

                    {f.esitoSdi && (
                        <DetailSection title="Esito SDI">
                            <div className={`esito-sdi${f.sdi === 'scartata' ? ' esito-sdi--errore' : ''}`}>
                                <strong>{f.esitoSdi.codice}</strong> — {f.esitoSdi.descrizione} ({formatDate(f.esitoSdi.data)})
                                {f.sdi === 'scartata' && <><br />Correggi l’anagrafica del cliente e reinvia.</>}
                            </div>
                        </DetailSection>
                    )}

                    {s && !isNotaCredito(f) && f.stato === 'emessa' && (
                        <DetailSection title="Pagamenti">
                            <div className="detail-stats-row">
                                <DetailStat label="Incassato" value={formatEuro(s.incassato)} />
                                <DetailStat label="Residuo" value={formatEuro(s.residuo)} />
                                <DetailStat label={`Scad. ${formatDate(s.scadenza)}`} value={<span className={`status-badge status-badge--${s.stato}`}>{STATO_PAGAMENTO_LABEL[s.stato]}</span>} />
                            </div>
                            {s.stornato > 0 && <p className="detail-notes detail-notes--compact">Stornati con nota di credito: {formatEuro(s.stornato)}</p>}
                            {incassi.length > 0 && (
                                <ul className="movement-list">
                                    {incassi.map((i) => (
                                        <li key={i.id} className="movement-item">
                                            <div className="movement-icon movement-icon--carico"><i className="fa-solid fa-coins" /></div>
                                            <div className="movement-text">
                                                <strong>{formatEuro(i.importo)}</strong>
                                                <span>{formatDate(i.data)} · {i.metodo}{i.note ? ` · ${i.note}` : ''}</span>
                                            </div>
                                            {onEliminaIncasso && (
                                                <button type="button" className="neu-icon-btn neu-icon-btn--sm" aria-label={`Elimina incasso del ${formatDate(i.data)}`} onClick={() => onEliminaIncasso(i.id)}>
                                                    <i className="fa-solid fa-trash-can" />
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </DetailSection>
                    )}

                    <StatoActions
                        title="Azioni"
                        note={f.stato === 'bozza'
                            ? 'In bozza il documento è modificabile e non ha numero. L’emissione assegna il numero fiscale e lo rende definitivo.'
                            : 'Documento emesso: non è più modificabile. Per correggerlo emetti una nota di credito.'}
                        actions={statoActions}
                        busy={busy}
                        emptyText="Nessuna azione disponibile per il tuo ruolo."
                    />

                    {f.note && (
                        <DetailSection title="Note">
                            <p className="detail-notes">{f.note}</p>
                        </DetailSection>
                    )}
                </div>
            )}
        </DetailPanelShell>
    );
}
