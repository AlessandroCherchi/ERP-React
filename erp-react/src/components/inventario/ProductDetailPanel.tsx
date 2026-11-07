import { StockBar } from './StockBar';
import { MovementList } from './MovementList';
import {
    DetailField, DetailHeader, DetailPanelShell, DetailSection, DetailStat, PanelActions, type PanelAction,
} from '../ui/DetailPanelShell';
import { formatEuro, formatNumber } from '../../lib/format';
import {
    margineUnitario, statoProdotto, STATO_LABEL, valoreGiacenza, type Movimento, type Prodotto,
} from '../../types/prodotto';

interface ProductDetailPanelProps {
    prodotto: Prodotto | null;
    /** Ragione sociale del fornitore abituale, risolta dalla pagina. */
    fornitore: string;
    /** Giacenza per magazzino (solo con multi-magazzino). */
    giacenzePerMagazzino?: Array<{ nome: string; quantita: number }>;
    /** Movimenti del solo prodotto aperto, già ordinati dal più recente. */
    movimenti: Movimento[];
    open: boolean;
    onClose: () => void;
    actions: PanelAction[];
}

/** Pannello dettaglio articolo: scorta, anagrafica, valorizzazione, storico movimenti. */
export function ProductDetailPanel({ prodotto, fornitore, giacenzePerMagazzino, movimenti, open, onClose, actions }: ProductDetailPanelProps) {
    return (
        <DetailPanelShell open={open} title="Dettaglio Articolo" onClose={onClose} footer={<PanelActions actions={actions} />}>
            {prodotto && (() => {
                const stato = statoProdotto(prodotto);
                return (
                    <div className="detail-panel-body">
                        <DetailHeader icon="fa-box" name={prodotto.nome} status={{ className: stato, label: STATO_LABEL[stato] }} />

                        <DetailSection title="Livello di Scorta">
                            <StockBar giacenza={prodotto.giacenza} scorta={prodotto.scorta} unita={prodotto.unita} />
                            <p className="detail-notes detail-notes--compact">
                                Soglia di riordino: {formatNumber(prodotto.scorta)} {prodotto.unita}
                            </p>
                        </DetailSection>

                        {giacenzePerMagazzino && (
                            <DetailSection title="Giacenza per Magazzino">
                                <div className="detail-grid">
                                    {giacenzePerMagazzino.map((g) => (
                                        <DetailField key={g.nome} label={g.nome} value={`${formatNumber(g.quantita)} ${prodotto.unita}`} />
                                    ))}
                                </div>
                            </DetailSection>
                        )}

                        <DetailSection title="Dati Articolo">
                            <div className="detail-grid">
                                <DetailField label="SKU" value={prodotto.sku} />
                                <DetailField label="Categoria" value={prodotto.categoria} />
                                <DetailField label="Fornitore" value={fornitore} />
                                <DetailField label="Ubicazione" value={prodotto.ubicazione} />
                                <DetailField label="Unità di misura" value={prodotto.unita} />
                                <DetailField label="Aliquota IVA" value={`${prodotto.iva}%`} />
                            </div>
                        </DetailSection>

                        <DetailSection title="Valorizzazione">
                            <div className="detail-stats-row">
                                <DetailStat label="Costo" value={formatEuro(prodotto.costo)} />
                                <DetailStat label="Prezzo" value={formatEuro(prodotto.prezzo)} />
                                <DetailStat label="Margine" value={formatEuro(margineUnitario(prodotto))} />
                            </div>
                            <p className="detail-notes detail-notes--compact">
                                Valore a magazzino: <strong>{formatEuro(valoreGiacenza(prodotto))}</strong>
                                {' '}({formatNumber(prodotto.giacenza)} × {formatEuro(prodotto.costo)})
                            </p>
                        </DetailSection>

                        <DetailSection title="Ultimi Movimenti">
                            <MovementList movimenti={movimenti} unita={prodotto.unita} empty="Nessun movimento registrato per questo articolo." />
                        </DetailSection>

                        <DetailSection title="Descrizione">
                            <p className="detail-notes">{prodotto.descrizione || 'Nessuna descrizione disponibile.'}</p>
                        </DetailSection>
                    </div>
                );
            })()}
        </DetailPanelShell>
    );
}
