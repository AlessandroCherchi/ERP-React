// Domain validation Fornitore — Implementation Contract v3.1 §3.
// Stesse regole dell'anagrafica cliente (nome + email obbligatori, email e
// PEC in formato valido) più i vincoli di fornitura.

import * as v from 'valibot';

export const fornitoreSchema = v.object({
    nome: v.pipe(v.string(), v.trim(), v.minLength(1, 'Campo obbligatorio')),
    email: v.pipe(v.string(), v.trim(), v.minLength(1, 'Campo obbligatorio'), v.email('Email non valida')),
    telefono: v.string(),
    citta: v.string(),
    provincia: v.string(),
    indirizzo: v.string(),
    piva: v.string(),
    cf: v.string(),
    pec: v.union([v.literal(''), v.pipe(v.string(), v.email('PEC non valida'))]),
    sdi: v.string(),
    note: v.string(),
    stato: v.picklist(['attivo', 'inattivo', 'sospeso']),
    categoria: v.string(),
    pagamento: v.string(),
    // Il lead time è un numero di giorni: mai negativo.
    leadTime: v.pipe(v.number(), v.minValue(0, 'Non può essere negativo')),
    iban: v.string(),
});
