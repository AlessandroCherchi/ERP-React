import { statoProdotto } from '../../types/prodotto';

interface StockBarProps {
    giacenza: number;
    scorta: number;
    unita: string;
}

/**
 * Barra di livello scorta: mostra a colpo d'occhio quanto manca alla
 * soglia di riordino. Il pieno è tarato su 2× la scorta minima, così la
 * soglia cade sempre a metà barra ed è confrontabile fra articoli con
 * volumi molto diversi (viteria da 1000 pz vs oscilloscopi da 4).
 *
 * Il colore non è l'unico indicatore: la quantità numerica è sempre
 * scritta accanto e lo stato è ripetuto nel badge della riga (a11y).
 */
export function StockBar({ giacenza, scorta, unita }: StockBarProps) {
    const stato = statoProdotto({ giacenza, scorta });
    const pieno = Math.max(scorta * 2, 1);
    const percentuale = Math.min(100, Math.round((giacenza / pieno) * 100));

    return (
        <div className="stock-cell">
            <span className="stock-qty">
                {giacenza.toLocaleString('it-IT')} <em>{unita}</em>
            </span>
            <div
                className="stock-bar"
                role="meter"
                aria-valuenow={giacenza}
                aria-valuemin={0}
                aria-valuemax={pieno}
                aria-label={`Giacenza ${giacenza} ${unita}, scorta minima ${scorta}`}
            >
                <span className={`stock-bar-fill stock-bar-fill--${stato}`} style={{ width: `${percentuale}%` }} />
            </div>
        </div>
    );
}
