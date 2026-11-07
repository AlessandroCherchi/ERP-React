// Validazione ordine d'acquisto: stesse regole di riga degli ordini di
// vendita (schema condiviso) + fornitore obbligatorio e consegna ≥ data.

import * as v from 'valibot';
import { rigaSchema } from './ordine';

const required = v.pipe(v.string(), v.trim(), v.minLength(1, 'Campo obbligatorio'));

export const acquistoSchema = v.pipe(
    v.object({
        numero: required,
        fornitoreId: v.pipe(v.number(), v.minValue(1, 'Seleziona un fornitore')),
        data: required,
        consegna: v.string(),
        righe: v.pipe(v.array(rigaSchema), v.minLength(1, 'Aggiungi almeno un articolo')),
        note: v.string(),
    }),
    v.forward(v.check((o) => !o.consegna || o.consegna >= o.data, "La consegna non può precedere la data dell'ordine"), ['consegna'])
);
