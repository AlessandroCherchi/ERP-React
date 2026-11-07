import { useMemo } from 'react';
import { formatEuro } from '../../lib/format';
import { imponibileRiga, totaliOrdine, type RigaOrdine } from '../../types/ordine';
import type { Prodotto } from '../../types/prodotto';

interface RigheOrdineEditorProps {
    righe: RigaOrdine[];
    /** Catalogo di magazzino: sorgente dei prezzi e delle disponibilità. */
    prodotti: Prodotto[];
    onChange: (righe: RigaOrdine[]) => void;
    /** Messaggio dello schema quando le righe non sono valide. */
    error?: string | undefined;
}

/**
 * Editor delle righe d'ordine.
 *
 * L'articolo si sceglie dal catalogo, mai a testo libero: è ciò che permette
 * di conoscere prezzo, unità di misura, aliquota e giacenza senza chiederli
 * all'operatore. Quantità, prezzo e sconto restano modificabili perché sono
 * la parte negoziata dell'ordine.
 *
 * La riga porta con sé sku/nome/unità/IVA: dal momento in cui è inserita è
 * uno snapshot, non un riferimento (vedi types/ordine.ts → RigaOrdine).
 */
export function RigheOrdineEditor({ righe, prodotti, onChange, error }: RigheOrdineEditorProps) {
    const perId = useMemo(() => new Map(prodotti.map((p) => [p.id, p])), [prodotti]);
    const totali = totaliOrdine(righe);

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
                prezzo: p.prezzo,
                sconto: 0,
                iva: p.iva,
            },
        ]);
    }

    function aggiorna(index: number, patch: Partial<RigaOrdine>) {
        onChange(righe.map((r, i) => (i === index ? { ...r, ...patch } : r)));
    }

    function rimuovi(index: number) {
        onChange(righe.filter((_r, i) => i !== index));
    }

    return (
        <div className={`righe-editor${error ? ' has-error' : ''}`}>
            <div className="righe-editor-head">
                <label htmlFor="riga-add">Righe ordine</label>
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
                                {p.nome} — {p.sku} ({p.giacenza.toLocaleString('it-IT')} {p.unita})
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
                        const scoperto = disponibile !== null && r.quantita > disponibile ? disponibile : null;

                        return (
                            <li className={`riga-item${scoperto !== null ? ' riga-item--warn' : ''}`} key={r.prodottoId}>
                                <div className="riga-prod">
                                    <span className="riga-nome">{r.nome}</span>
                                    <span className="riga-sku">
                                        {r.sku}
                                        {disponibile !== null
                                            ? ` · disp. ${disponibile.toLocaleString('it-IT')} ${r.unita}`
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
                                        Giacenza insufficiente: disponibili {scoperto.toLocaleString('it-IT')} {r.unita}.
                                        L&apos;ordine si salva comunque, ma la conferma verrà rifiutata.
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
                <div className="ordine-totali-row">
                    <span>IVA</span>
                    <span>{formatEuro(totali.iva)}</span>
                </div>
                <div className="ordine-totali-row ordine-totali-row--grand">
                    <span>Totale ordine</span>
                    <span>{formatEuro(totali.totale)}</span>
                </div>
            </div>
        </div>
    );
}
