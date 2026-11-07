// Domain validation — Implementation Contract v3.1 §3, Valibot ai
// confini. Stessa regola di clienti.js: nome + email obbligatori,
// email in formato valido.

import * as v from 'valibot';

export const clienteSchema = v.object({
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
    stato: v.picklist(['attivo', 'inattivo', 'prospect']),
    note: v.string(),
});
