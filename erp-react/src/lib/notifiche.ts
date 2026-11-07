// Centro notifiche: avvisi derivati dallo stato dei dati, non messaggi
// salvati. Una notifica sparisce da sola quando la condizione che la genera
// viene risolta (articolo riordinato, fattura incassata…).

import { statoProdotto, type Prodotto } from '../types/prodotto';
import { inRitardo, type Ordine } from '../types/ordine';
import { isNotaCredito, situazione, type Fattura, type Incasso } from '../types/fattura';
import { acquistoInRitardo, type OrdineAcquisto } from '../types/acquisto';
import type { ModuleId } from '../app/moduleIds';

export type Livello = 'danger' | 'warning' | 'info';

export interface Notifica {
    id: string;
    livello: Livello;
    icon: string;
    testo: string;
    /** Destinazione (route + filtri) che mostra gli elementi interessati. */
    link: string;
    modulo: ModuleId;
}

interface Sorgenti {
    prodotti: readonly Prodotto[];
    ordini: readonly Ordine[];
    fatture: readonly Fattura[];
    incassi: readonly Incasso[];
    acquisti: readonly OrdineAcquisto[];
    oggi: string;
}

const plurale = (n: number, uno: string, molti: string) => `${n} ${n === 1 ? uno : molti}`;

export function calcolaNotifiche(s: Sorgenti): Notifica[] {
    const out: Notifica[] = [];
    const esauriti = s.prodotti.filter((p) => statoProdotto(p) === 'esaurito').length;
    const sotto = s.prodotti.filter((p) => statoProdotto(p) === 'sotto-scorta').length;
    if (esauriti) out.push({ id: 'esauriti', livello: 'danger', icon: 'fa-circle-xmark', testo: `${plurale(esauriti, 'articolo esaurito', 'articoli esauriti')}`, link: '/inventario?stato=esaurito', modulo: 'inventario' });
    if (sotto) out.push({ id: 'sotto-scorta', livello: 'warning', icon: 'fa-triangle-exclamation', testo: `${plurale(sotto, 'articolo', 'articoli')} sotto scorta`, link: '/inventario?stato=sotto-scorta', modulo: 'inventario' });

    const ritardoVendite = s.ordini.filter((o) => inRitardo(o, s.oggi)).length;
    if (ritardoVendite) out.push({ id: 'ordini-ritardo', livello: 'warning', icon: 'fa-clock-rotate-left', testo: `${plurale(ritardoVendite, 'ordine cliente', 'ordini cliente')} in ritardo`, link: '/vendite?ritardo=1', modulo: 'vendite' });

    const ritardoAcquisti = s.acquisti.filter((o) => acquistoInRitardo(o, s.oggi)).length;
    if (ritardoAcquisti) out.push({ id: 'acquisti-ritardo', livello: 'info', icon: 'fa-truck-ramp-box', testo: `${plurale(ritardoAcquisti, 'consegna fornitore', 'consegne fornitore')} in ritardo`, link: '/acquisti', modulo: 'acquisti' });

    const scartate = s.fatture.filter((f) => f.stato === 'emessa' && f.sdi === 'scartata').length;
    if (scartate) out.push({ id: 'sdi-scartate', livello: 'danger', icon: 'fa-file-circle-exclamation', testo: `${plurale(scartate, 'fattura scartata', 'fatture scartate')} dallo SDI`, link: '/fatture?sdi=scartata', modulo: 'fatture' });

    const daInviare = s.fatture.filter((f) => f.stato === 'emessa' && f.sdi === 'da-inviare').length;
    if (daInviare) out.push({ id: 'sdi-da-inviare', livello: 'info', icon: 'fa-paper-plane', testo: `${plurale(daInviare, 'fattura', 'fatture')} da inviare allo SDI`, link: '/fatture?sdi=da-inviare', modulo: 'fatture' });

    const scadute = s.fatture.filter((f) => f.stato === 'emessa' && !isNotaCredito(f) && situazione(f, s.incassi, s.fatture, s.oggi).stato === 'scaduta').length;
    if (scadute) out.push({ id: 'scadute', livello: 'warning', icon: 'fa-hourglass-end', testo: `${plurale(scadute, 'fattura scaduta', 'fatture scadute')} da incassare`, link: '/contabilita', modulo: 'contabilita' });

    const ordine: Record<Livello, number> = { danger: 0, warning: 1, info: 2 };
    return out.sort((a, b) => ordine[a.livello] - ordine[b.livello]);
}
