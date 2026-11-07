import { formatDate, formatNumber } from '../../lib/format';
import { MOVIMENTO_LABEL, type Movimento } from '../../types/prodotto';

const ICON: Record<Movimento['tipo'], string> = {
    carico: 'fa-arrow-down',
    scarico: 'fa-arrow-up',
    rettifica: 'fa-scale-balanced',
    trasferimento: 'fa-right-left',
};

/** Segno con cui il movimento ha inciso sulla giacenza. */
function segno(m: Movimento): string {
    if (m.tipo === 'rettifica') return '=';
    if (m.tipo === 'trasferimento') return '⇄';
    return m.tipo === 'carico' ? '+' : '−';
}

/** Storico movimenti di un articolo (registro di magazzino). */
export function MovementList({ movimenti, unita, empty }: { movimenti: Movimento[]; unita: string; empty: string }) {
    if (movimenti.length === 0) return <p className="detail-notes">{empty}</p>;
    return (
        <ul className="movement-list">
            {movimenti.map((m) => (
                <li className="movement-item" key={m.id}>
                    <div className={`movement-icon movement-icon--${m.tipo}`}><i className={`fa-solid ${ICON[m.tipo]}`} /></div>
                    <div className="movement-text">
                        <strong>{MOVIMENTO_LABEL[m.tipo]} · {m.causale}</strong>
                        <span>{formatDate(m.data)} — giacenza dopo: {formatNumber(m.giacenzaFinale)} {unita}</span>
                    </div>
                    <div className={`movement-qty movement-qty--${m.tipo}`}>{segno(m)}{formatNumber(m.quantita)}</div>
                </li>
            ))}
        </ul>
    );
}
