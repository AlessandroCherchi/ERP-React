import type { PrintableDocument } from '../documenti/PrintPreview';
import { formatDate } from '../../lib/format';
import { labelPagamento } from '../../types/fornitore';
import { isNotaCredito, scadenza, TIPO_DOCUMENTO_LABEL, type Fattura } from '../../types/fattura';

/** Fattura → modello di stampa (copia di cortesia: il documento fiscale è l'XML SDI). */
export function printableFattura(f: Fattura, origine?: string): PrintableDocument {
    return {
        titolo: TIPO_DOCUMENTO_LABEL[f.tipo],
        numero: f.numero ?? 'BOZZA',
        data: f.data,
        destinatario: {
            etichetta: 'Cessionario / committente',
            righe: [
                f.cliente.nome,
                f.cliente.indirizzo,
                [f.cliente.citta, f.cliente.provincia && `(${f.cliente.provincia})`].filter(Boolean).join(' '),
                f.cliente.piva && `P.IVA ${f.cliente.piva}`,
                f.cliente.cf && f.cliente.cf !== f.cliente.piva.replace(/^IT/, '') ? `C.F. ${f.cliente.cf}` : '',
                f.cliente.sdi ? `Codice destinatario ${f.cliente.sdi}` : f.cliente.pec ? `PEC ${f.cliente.pec}` : '',
            ],
        },
        dettagli: [
            ['Tipo documento', f.tipo],
            ...(isNotaCredito(f)
                ? ([['Storno di', origine ?? '—']] as Array<[string, string]>)
                : ([['Pagamento', labelPagamento(f.terminiPagamento)], ['Scadenza', formatDate(scadenza(f))], ['Metodo', f.metodoPagamento]] as Array<[string, string]>)),
        ],
        righe: f.righe,
        note: f.note,
        piede: 'Copia di cortesia priva di valore fiscale ai sensi dell’art. 21 DPR 633/72. Il documento fiscale è trasmesso tramite SDI.',
    };
}
