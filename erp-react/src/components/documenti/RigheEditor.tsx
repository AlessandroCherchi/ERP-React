import { useMemo } from 'react';
import { formatEuro, formatNumber } from '../../lib/format';
import { imponibileRiga, riepilogoIva, totaliDocumento, type RigaDocumento } from '../../types/documento';
import type { Prodotto } from '../../types/prodotto';
import '../../styles/documenti.css';

interface RigheEditorProps {
    righe: RigaDocumento[];
    /** Catalogo di magazzino: sorgente dei prezzi e delle disponibilità. */
    prodotti: Prodotto[];
    onChange: (righe: RigaDocumento[]) => void;
    /** Messaggio dello schema quando le righe non sono valide. */
    error?: string | undefined;
    /** Prezzo proposto per l'articolo: listino in vendita, costo in acquisto. */
    prezzoDi?: (p: Prodotto) => number;
    /** Avvisa se la quantità supera la giacenza (documenti di uscita). */
    verificaGiacenza?: boolean;
    /** Etichetta del totale ("Totale ordine", "Totale documento"…). */
    totaleLabel?: string;
}

/**
 * Editor delle righe di un documento (ordine di vendita, ordine d'acquisto,
 * fattura): stesso componente, cambia solo il prezzo proposto e se va
 * verificata la giacenza.
 *
 * L'articolo si sceglie dal catalogo, mai a testo libero: è ciò che permette
 * di conoscere prezzo, unità di misura, aliquota e giacenza senza chiederli
 * all'operatore. Quantità, prezzo e sconto restano modificabili perché sono
 * la parte negoziata dell'ordine.
 *
 * La riga porta con sé sku/nome/unità/IVA: dal momento in cui è inserita è
 * uno snapshot, non un riferimento (vedi types/documento.ts → RigaDocumento).
 */
export function RigheEditor({
    righe, prodotti, onChange, error,
    prezzoDi = (p) => p.prezzo, verificaGiacenza = true, totaleLabel = 'Totale documento',
}: RigheEditorProps) {
    const perId = useMemo(() => new Map(prodotti.map((p) => [p.id, p])), [prodotti]);
    const totali = totaliDocumento(righe);
    const riepilogo = riepilogoIva(righe);

    /**
     * Aggiunge l'articolo scelto. Se è già in ordine incrementa la riga
     * esistente invece di crearne una seconda: due righe sullo stesso
     * articolo scaricherebbero il magazzino due volte con quantità separate,
     * rendendo illeggibile sia il documento sia il registro movimenti.
     */
    function aggiungi(prodottoId: number) {
        const p = perId.get(prodottoId);
        if (!p) return;

        const esistente = righe.findIndex((r) => r.prodottoId === prodottoId);
        if (esistente !== -1) {
            onChange(righe.map((r, i) => (i === esistente ? { ...r, quantita: r.quantita + 1 } : r)));
            return;
        }

        onChange([
            ...righe,
            {
                prodottoId: p.id,
                sku: p.sku,
                nome: p.nome,
                unita: p.unita,
                quantita: 1,
                prezzo: prezzoDi(p),
                sconto: 0,
                iva: p.iva,
            },
        ]);
    }

    function aggiorna(index: number, patch: Partial<RigaDocumento>) {
        onChange(righe.map((r, i) => (i === index ? { ...r, ...patch } : r)));
    }

    function rimuovi(index: number) {
        onChange(righe.filter((_r, i) => i !== index));
    }

    return (
        <div className={`righe-editor${error ? ' has-error' : ''}`}>
            <div className="righe-editor-head">
                <label htmlFor="riga-add">Righe</label>
                <div className="select-box righe-add">
                    <select
                        id="riga-add"
                        value=""
                        onChange={(e) => {
                            if (e.target.value) aggiungi(Number(e.target.value));
                        }}
                    >
                        <option value="">+ Aggiungi articolo dal catalogo…</option>
                        {prodotti.map((p) => (
                            <option value={p.id} key={p.id}>
                                {p.nome} — {p.sku} ({formatNumber(p.giacenza)} {p.unita})
                            </option>
                        ))}
                    </select>
                    <i className="fa-solid fa-chevron-down" />
                </div>
            </div>

            {righe.length === 0 ? (
                <p className="righe-empty">
                    <i className="fa-solid fa-cart-shopping" />
                    Nessun articolo. Scegli un prodotto dal catalogo per iniziare.
                </p>
            ) : (
                <ul className="righe-list">
                    <li className="riga-item riga-item--head" aria-hidden="true">
                        <span>Articolo</span>
                        <span>Q.tà</span>
                        <span>Prezzo</span>
                        <span>Sc. %</span>
                        <span>Imponibile</span>
                        <span />
                    </li>

                    {righe.map((r, i) => {
                        const p = perId.get(r.prodottoId);
                        // L'articolo può essere stato eliminato dal catalogo dopo
                        // l'inserimento: la riga resta valida (è uno snapshot), ma
                        // la disponibilità non è più verificabile.
                        const disponibile = p ? p.giacenza : null;
                        // Quantità disponibile quando la riga è scoperta, altrimenti null:
                        // un solo valore da controllare, sia per la classe sia per l'avviso.
                        const scoperto = verificaGiacenza && disponibile !== null && r.quantita > disponibile ? disponibile : null;

                        return (
                            <li className={`riga-item${scoperto !== null ? ' riga-item--warn' : ''}`} key={r.prodottoId}>
                                <div className="riga-prod">
                                    <span className="riga-nome">{r.nome}</span>
                                    <span className="riga-sku">
                                        {r.sku}
                                        {disponibile !== null
                                            ? ` · disp. ${formatNumber(disponibile)} ${r.unita}`
                                            : ' · non più a catalogo'}
                                    </span>
                                </div>

                                <input
                                    className="riga-input"
                                    type="number"
                                    min={1}
                                    step={1}
                                    aria-label={`Quantità ${r.nome}`}
                                    value={String(r.quantita)}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => aggiorna(i, { quantita: Math.max(0, Number(e.target.value) || 0) })}
                                />
                                <input
                                    className="riga-input"
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    aria-label={`Prezzo unitario ${r.nome}`}
                                    value={String(r.prezzo)}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => aggiorna(i, { prezzo: Math.max(0, Number(e.target.value) || 0) })}
                                />
                                <input
                                    className="riga-input"
                                    type="number"
                                    min={0}
                                    max={100}
                                    step={1}
                                    aria-label={`Sconto ${r.nome}`}
                                    value={String(r.sconto)}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) =>
                                        aggiorna(i, { sconto: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })
                                    }
                                />

                                <span className="riga-tot">{formatEuro(imponibileRiga(r))}</span>

                                <button
                                    type="button"
                                    className="neu-icon-btn neu-icon-btn--sm riga-del"
                                    aria-label={`Rimuovi ${r.nome}`}
                                    title="Rimuovi riga"
                                    onClick={() => rimuovi(i)}
                                >
                                    <i className="fa-solid fa-xmark" />
                                </button>

                                {scoperto !== null && (
                                    <p className="riga-warn">
                                        <i className="fa-solid fa-triangle-exclamation" />
                                        Giacenza insufficiente: disponibili {formatNumber(scoperto)} {r.unita}.
                                        Il documento si salva comunque, ma la conferma verrà rifiutata.
                                    </p>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {error && <p className="riga-error"><i className="fa-solid fa-circle-exclamation" /> {error}</p>}

            <div className="ordine-totali">
                <div className="ordine-totali-row">
                    <span>Imponibile</span>
                    <span>{formatEuro(totali.imponibile)}</span>
                </div>
                {riepilogo.map((x) => (
                    <div className="ordine-totali-row" key={x.aliquota}>
                        <span>IVA {x.aliquota}% su {formatEuro(x.imponibile)}</span>
                        <span>{formatEuro(x.imposta)}</span>
                    </div>
                ))}
                <div className="ordine-totali-row ordine-totali-row--grand">
                    <span>{totaleLabel}</span>
                    <span>{formatEuro(totali.totale)}</span>
                </div>
            </div>
        </div>
    );
}
