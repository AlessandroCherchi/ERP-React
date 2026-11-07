// Dominio Fatture e incassi (ciclo attivo).
//
// Confine con il backend (spec §2, §11): il frontend prepara le BOZZE e
// mostra stati ed esiti. Numerazione fiscale, XML FatturaPA, invio allo SDI
// e ricezione delle notifiche sono del backend: qui l'adapter mock li
// simula con la stessa interfaccia, e nessun calcolo fiscale definitivo
// vive nel bundle.

import { riepilogoIva, totaliDocumento, type RigaDocumento, type TotaliDocumento } from './documento';
import { cents, fromCents, sumCents, toCents, type Cents } from '../lib/money';

/** Tipi documento FatturaPA supportati. */
export type TipoDocumento = 'TD01' | 'TD24' | 'TD04';

export const TIPO_DOCUMENTO_LABEL: Record<TipoDocumento, string> = {
    TD01: 'Fattura',
    TD24: 'Fattura differita',
    TD04: 'Nota di credito',
};

/** Stato del documento: in bozza è modificabile, emessa è un atto fiscale. */
export type StatoFattura = 'bozza' | 'emessa';

/** Stato di trasmissione allo SDI (mappatura semplificata delle notifiche). */
export type StatoSdi = 'da-inviare' | 'inviata' | 'consegnata' | 'mancata-consegna' | 'scartata';

export const STATO_SDI_LABEL: Record<StatoSdi, string> = {
    'da-inviare': 'Da inviare',
    inviata: 'Inviata',
    consegnata: 'Consegnata',
    'mancata-consegna': 'Mancata consegna',
    scartata: 'Scartata',
};

/** Dati del cessionario al momento dell'emissione (snapshot, come le righe). */
export interface ClienteSnapshot {
    nome: string;
    piva: string;
    cf: string;
    indirizzo: string;
    citta: string;
    provincia: string;
    sdi: string;
    pec: string;
}

export interface EsitoSdi {
    codice: string;
    descrizione: string;
    data: string;
}

export interface Fattura {
    id: number;
    /** Assegnato all'emissione (numerazione fiscale: backend). null in bozza. */
    numero: string | null;
    tipo: TipoDocumento;
    clienteId: number;
    cliente: ClienteSnapshot;
    data: string;
    /** Termini di pagamento in giorni (tabella del tenant). */
    terminiPagamento: string;
    metodoPagamento: string;
    righe: RigaDocumento[];
    /** Ordini di vendita fatturati da questo documento. */
    ordineIds: number[];
    /** Per le note di credito: fattura stornata. */
    fatturaOrigineId?: number;
    stato: StatoFattura;
    sdi: StatoSdi;
    esitoSdi?: EsitoSdi;
    note: string;
}

export interface Incasso {
    id: number;
    fatturaId: number;
    data: string;
    importo: number;
    metodo: string;
    note: string;
}

export type FatturaFormValues = Pick<Fattura, 'tipo' | 'clienteId' | 'data' | 'terminiPagamento' | 'metodoPagamento' | 'righe' | 'note'> & {
    ordineIds?: number[];
    fatturaOrigineId?: number;
};

export const EMPTY_FATTURA_FORM: FatturaFormValues = {
    tipo: 'TD01', clienteId: 0, data: '', terminiPagamento: '30', metodoPagamento: 'bonifico', righe: [], note: '',
};

export const fatturaModificabile = (f: Pick<Fattura, 'stato'>) => f.stato === 'bozza';
export const isNotaCredito = (f: Pick<Fattura, 'tipo'>) => f.tipo === 'TD04';
/** Si invia (o reinvia dopo uno scarto) solo un documento emesso. */
export const fatturaInviabile = (f: Pick<Fattura, 'stato' | 'sdi'>) => f.stato === 'emessa' && (f.sdi === 'da-inviare' || f.sdi === 'scartata');

export const totaliFattura = (f: Pick<Fattura, 'righe'>): TotaliDocumento => totaliDocumento(f.righe);

/** Data di scadenza: data documento + giorni dei termini di pagamento. */
export function scadenza(f: Pick<Fattura, 'data' | 'terminiPagamento'>): string {
    const d = new Date(`${f.data}T00:00:00`);
    d.setDate(d.getDate() + (Number(f.terminiPagamento) || 0));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ------------------------- SITUAZIONE PAGAMENTI -------------------------

export type StatoPagamento = 'pagata' | 'parziale' | 'da-incassare' | 'scaduta';

export const STATO_PAGAMENTO_LABEL: Record<StatoPagamento, string> = {
    pagata: 'Pagata',
    parziale: 'Incasso parziale',
    'da-incassare': 'Da incassare',
    scaduta: 'Scaduta',
};

export interface Situazione {
    totale: number;
    incassato: number;
    /** Totale delle note di credito emesse a storno di questa fattura. */
    stornato: number;
    residuo: number;
    stato: StatoPagamento;
    scadenza: string;
}

/**
 * Situazione di una fattura emessa: residuo = totale − incassi − note di
 * credito collegate. In centesimi, come il resto dell'aritmetica documentale.
 */
export function situazione(f: Fattura, incassi: readonly Incasso[], fatture: readonly Fattura[], oggi: string): Situazione {
    const totale = toCents(totaliFattura(f).totale);
    const incassato = sumCents(incassi.filter((i) => i.fatturaId === f.id).map((i) => toCents(i.importo)));
    const stornato = sumCents(
        fatture
            .filter((n) => n.fatturaOrigineId === f.id && n.stato === 'emessa')
            .map((n) => toCents(totaliFattura(n).totale))
    );
    const residuo = cents(Math.max(0, totale - incassato - stornato));
    const sc = scadenza(f);
    const stato: StatoPagamento = residuo === 0 ? 'pagata' : sc < oggi ? 'scaduta' : incassato > 0 ? 'parziale' : 'da-incassare';
    return { totale: fromCents(totale), incassato: fromCents(incassato), stornato: fromCents(stornato), residuo: fromCents(residuo), stato, scadenza: sc };
}

/** Fasce di anzianità dello scaduto (aging) per lo scadenzario. */
export type FasciaAging = 'a-scadere' | '0-30' | '31-60' | '61-90' | 'oltre-90';

export const FASCIA_LABEL: Record<FasciaAging, string> = {
    'a-scadere': 'A scadere',
    '0-30': 'Scaduto 0–30 gg',
    '31-60': 'Scaduto 31–60 gg',
    '61-90': 'Scaduto 61–90 gg',
    'oltre-90': 'Scaduto oltre 90 gg',
};

export function giorniTra(da: string, a: string): number {
    return Math.round((new Date(`${a}T00:00:00`).getTime() - new Date(`${da}T00:00:00`).getTime()) / 86_400_000);
}

export function fasciaAging(scad: string, oggi: string): FasciaAging {
    const ritardo = giorniTra(scad, oggi);
    if (ritardo <= 0) return 'a-scadere';
    if (ritardo <= 30) return '0-30';
    if (ritardo <= 60) return '31-60';
    if (ritardo <= 90) return '61-90';
    return 'oltre-90';
}

/** Righe di fattura dagli ordini consegnati (snapshot già presente sugli ordini). */
export function righeDaOrdini(ordini: ReadonlyArray<{ righe: RigaDocumento[] }>): RigaDocumento[] {
    return ordini.flatMap((o) => o.righe.map((r) => ({ ...r })));
}

/** Ordini già coperti da una fattura (le note di credito non "liberano" l'ordine). */
export function ordiniGiaFatturati(fatture: readonly Pick<Fattura, 'tipo' | 'ordineIds'>[]): Set<number> {
    return new Set(fatture.filter((f) => f.tipo !== 'TD04').flatMap((f) => f.ordineIds));
}

/** Bozza di nota di credito a storno totale di una fattura emessa. */
export function notaCreditoDa(f: Fattura, data: string): FatturaFormValues {
    return {
        tipo: 'TD04',
        clienteId: f.clienteId,
        data,
        terminiPagamento: '0',
        metodoPagamento: f.metodoPagamento,
        righe: f.righe.map((r) => ({ ...r })),
        note: `Storno ${f.numero ?? ''}`.trim(),
        fatturaOrigineId: f.id,
    };
}

// ------------------------- REGISTRO IVA VENDITE -------------------------

export interface RigaRegistroIva {
    /** Periodo yyyy-mm. */
    periodo: string;
    aliquota: number;
    imponibile: number;
    imposta: number;
}

/**
 * Registro IVA vendite per mese e aliquota dai documenti emessi; le note di
 * credito entrano con segno negativo. Indicativo: la liquidazione periodica
 * ufficiale è calcolata dal backend/consulente (spec §10-§11).
 */
export function registroIvaVendite(fatture: readonly Fattura[]): RigaRegistroIva[] {
    const acc = new Map<string, { imponibile: number; imposta: number }>();
    for (const f of fatture) {
        if (f.stato !== 'emessa') continue;
        const segno = isNotaCredito(f) ? -1 : 1;
        for (const x of riepilogoIva(f.righe)) {
            const key = `${f.data.slice(0, 7)}|${x.aliquota}`;
            const cur = acc.get(key) ?? { imponibile: 0, imposta: 0 };
            cur.imponibile = fromCents((toCents(cur.imponibile) + segno * toCents(x.imponibile)) as Cents);
            cur.imposta = fromCents((toCents(cur.imposta) + segno * toCents(x.imposta)) as Cents);
            acc.set(key, cur);
        }
    }
    return [...acc.entries()]
        .map(([key, v]) => { const [periodo, aliquota] = key.split('|'); return { periodo: periodo!, aliquota: Number(aliquota), ...v }; })
        .sort((a, b) => b.periodo.localeCompare(a.periodo) || b.aliquota - a.aliquota);
}
