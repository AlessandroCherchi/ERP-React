// Domain validation Ordine — Implementation Contract v3.1 §3.
//
// Rispetto agli schemi delle anagrafiche qui ci sono due cose in più:
// una regola che mette in relazione due campi (consegna ≥ data) e la
// validazione di una collezione (le righe). Entrambe stanno nello schema
// e non nel componente, altrimenti la stessa regola andrebbe riscritta
// nel modale della pagina Vendite e in quello della Dashboard.

import * as v from 'valibot';

const required = v.pipe(v.string(), v.trim(), v.minLength(1, 'Campo obbligatorio'));

/** Riga di documento già tipizzata (l'editor la costruisce dal prodotto): condivisa da ordini, acquisti, fatture. */
export const rigaSchema = v.object({
    prodottoId: v.pipe(v.number(), v.minValue(1)),
    sku: v.string(),
    nome: v.string(),
    unita: v.string(),
    quantita: v.pipe(v.number(), v.minValue(1, 'La quantità deve essere almeno 1')),
    prezzo: v.pipe(v.number(), v.minValue(0, 'Il prezzo non può essere negativo')),
    sconto: v.pipe(v.number(), v.minValue(0, 'Sconto non valido'), v.maxValue(100, 'Sconto massimo 100%')),
    iva: v.pipe(v.number(), v.minValue(0)),
});

export const ordineSchema = v.pipe(
    v.object({
        numero: required,
        // 0 è il valore "nessuna selezione" della <select> cliente.
        clienteId: v.pipe(v.number(), v.minValue(1, 'Seleziona un cliente')),
        data: required,
        consegna: v.string(),
        priorita: v.picklist(['bassa', 'normale', 'alta', 'urgente'] as const),
        righe: v.pipe(
            v.array(rigaSchema),
            v.minLength(1, "Aggiungi almeno un articolo all'ordine")
        ),
        note: v.string(),
    }),
    // Una consegna anteriore alla data d'ordine è un errore di battitura,
    // non una scelta: intercettarlo qui evita ordini nati già "in ritardo".
    v.forward(
        v.check(
            (o) => !o.consegna || o.consegna >= o.data,
            "La consegna non può precedere la data dell'ordine"
        ),
        ['consegna']
    )
);
