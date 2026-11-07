// Dominio Ordine d'acquisto (ciclo passivo).
//
// Il ciclo: bozza → inviato al fornitore → ricevuto (anche a più riprese,
// "parziale"). Il magazzino si muove al RICEVIMENTO, non all'invio: finché
// la merce non è fisicamente entrata non è disponibile per le vendite.
// Ogni ricevimento genera movimenti di carico e aggiorna il costo medio
// ponderato dell'articolo (valorizzazione di magazzino).

import { createStateMachine } from '../lib/stateMachine';
import { totaliDocumento, type RigaDocumento } from './documento';
import type { Prodotto } from './prodotto';

export type AcquistoStato = 'bozza' | 'inviato' | 'parziale' | 'ricevuto' | 'annullato';

export const STATO_ACQUISTO_LABEL: Record<AcquistoStato, string> = {
    bozza: 'Bozza',
    inviato: 'Inviato',
    parziale: 'Ricevuto in parte',
    ricevuto: 'Ricevuto',
    annullato: 'Annullato',
};

/**
 * "parziale" e "ricevuto" si raggiungono solo registrando un ricevimento,
 * mai a mano; un ordine con merce già entrata non si annulla (si chiude
 * con quanto ricevuto: vedi chiudiParziale).
 */
export const acquistoMachine = createStateMachine<AcquistoStato>({
    bozza: ['inviato', 'annullato'],
    inviato: ['parziale', 'ricevuto', 'annullato'],
    parziale: ['ricevuto'],
    ricevuto: [],
    annullato: [],
});

/** Riga d'acquisto: riga di documento + quantità già ricevuta. */
export interface RigaAcquisto extends RigaDocumento {
    ricevuta: number;
}

export interface OrdineAcquisto {
    id: number;
    numero: string;
    fornitoreId: number;
    /** Ragione sociale al momento dell'ordine (snapshot). */
    fornitore: string;
    data: string;
    /** Consegna prevista (ISO), '' se non concordata. */
    consegna: string;
    stato: AcquistoStato;
    righe: RigaAcquisto[];
    note: string;
}

export type AcquistoFormValues = Pick<OrdineAcquisto, 'numero' | 'fornitoreId' | 'data' | 'consegna' | 'note'> & {
    righe: RigaDocumento[];
};

export const EMPTY_ACQUISTO_FORM: AcquistoFormValues = {
    numero: '', fornitoreId: 0, data: '', consegna: '', note: '', righe: [],
};

export const totaliAcquisto = (o: Pick<OrdineAcquisto, 'righe'>) => totaliDocumento(o.righe);

export function residuo(r: Pick<RigaAcquisto, 'quantita' | 'ricevuta'>): number {
    return Math.max(0, r.quantita - r.ricevuta);
}

/** Stato conseguente alle quantità ricevute. */
export function statoDaRicevimento(righe: readonly RigaAcquisto[]): 'inviato' | 'parziale' | 'ricevuto' {
    if (righe.every((r) => residuo(r) === 0)) return 'ricevuto';
    return righe.some((r) => r.ricevuta > 0) ? 'parziale' : 'inviato';
}

export const acquistoModificabile = (s: AcquistoStato) => s === 'bozza';
export const acquistoEliminabile = (s: AcquistoStato) => s === 'bozza' || s === 'annullato';
/** Si può ricevere merce su ordini inviati o ricevuti in parte. */
export const acquistoRicevibile = (s: AcquistoStato) => s === 'inviato' || s === 'parziale';
export const acquistoAperto = (s: AcquistoStato) => s !== 'ricevuto' && s !== 'annullato';

export function acquistoInRitardo(o: Pick<OrdineAcquisto, 'consegna' | 'stato'>, oggi: string): boolean {
    return Boolean(o.consegna) && o.consegna < oggi && acquistoRicevibile(o.stato);
}

/**
 * Costo medio ponderato dopo un carico:
 * (giacenza × costo attuale + quantità × costo d'acquisto) / (giacenza + quantità).
 * Con giacenza zero il nuovo costo è quello d'acquisto. Arrotondato al centesimo
 * di euro per unità (precisione sufficiente alla valorizzazione).
 */
export function costoMedioPonderato(giacenza: number, costo: number, quantita: number, costoAcquisto: number): number {
    const tot = Math.max(0, giacenza) + quantita;
    if (tot <= 0) return costoAcquisto;
    const medio = (Math.max(0, giacenza) * costo + quantita * costoAcquisto) / tot;
    return Math.round(medio * 100) / 100;
}

/** Costo unitario netto di riga (prezzo d'acquisto al netto dello sconto). */
export function costoNettoUnitario(r: Pick<RigaDocumento, 'prezzo' | 'sconto'>): number {
    return Math.round(r.prezzo * (1 - r.sconto / 100) * 100) / 100;
}

// ------------------------- RIORDINO -------------------------

export interface PropostaRiordino {
    fornitoreId: number;
    righe: Array<{ prodotto: Prodotto; quantita: number }>;
}

/**
 * Proposte di riordino per gli articoli sotto scorta.
 * Obiettivo: riportare la disponibilità a 2 × scorta minima, contando la
 * merce già in arrivo (residui degli ordini aperti, bozze comprese — così
 * rigenerare le proposte non duplica ordini già preparati).
 * Gli articoli senza fornitore abituale non sono proponibili.
 */
export function proposteRiordino(prodotti: readonly Prodotto[], ordini: readonly OrdineAcquisto[]): PropostaRiordino[] {
    const inArrivo = new Map<number, number>();
    for (const o of ordini) {
        if (!acquistoAperto(o.stato)) continue;
        for (const r of o.righe) inArrivo.set(r.prodottoId, (inArrivo.get(r.prodottoId) ?? 0) + residuo(r));
    }

    const perFornitore = new Map<number, PropostaRiordino>();
    for (const p of prodotti) {
        if (p.fornitoreId == null || p.giacenza > p.scorta) continue;
        const quantita = Math.ceil(2 * p.scorta - p.giacenza - (inArrivo.get(p.id) ?? 0));
        if (quantita <= 0) continue;
        const prop = perFornitore.get(p.fornitoreId) ?? { fornitoreId: p.fornitoreId, righe: [] };
        prop.righe.push({ prodotto: p, quantita });
        perFornitore.set(p.fornitoreId, prop);
    }
    return [...perFornitore.values()];
}

/** Righe d'ordine da una proposta di riordino, al costo attuale dell'articolo. */
export function righeDaProposta(p: PropostaRiordino): RigaDocumento[] {
    return p.righe.map(({ prodotto, quantita }) => ({
        prodottoId: prodotto.id, sku: prodotto.sku, nome: prodotto.nome, unita: prodotto.unita,
        quantita, prezzo: prodotto.costo, sconto: 0, iva: prodotto.iva,
    }));
}
