// Domain validation magazzino — Implementation Contract v3.1 §3.
// Lo schema del prodotto è già condiviso con la quick action della
// Dashboard (schemas/quickActions.ts → prodottoSchema): qui vive solo
// ciò che è specifico dei movimenti di magazzino.

import * as v from 'valibot';

const required = v.pipe(v.string(), v.trim(), v.minLength(1, 'Campo obbligatorio'));

/**
 * Quantità: stringa non vuota che rappresenti un numero > 0.
 * Resta string come il resto dei form (parsing con parseNum al submit),
 * ma il vincolo di positività è di dominio e va validato qui — non
 * lasciato al solo `min` nativo dell'<input>, aggirabile da tastiera.
 */
const quantita = v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, 'Campo obbligatorio'),
    v.transform((s) => s.replace(',', '.')),
    v.check((s) => Number.isFinite(Number(s)), 'Valore non numerico'),
    v.check((s) => Number(s) > 0, 'Deve essere maggiore di zero')
);

export const movimentoSchema = v.object({
    tipo: v.picklist(['carico', 'scarico', 'rettifica'] as const),
    quantita,
    causale: required,
    data: required,
    note: v.string(),
});
