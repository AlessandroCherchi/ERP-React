// Domain validation magazzino — Implementation Contract v3.1 §3:
// anagrafica articolo (condivisa da Inventario e azione rapida della
// Dashboard) e movimenti di magazzino.

import * as v from 'valibot';

const optional = v.string();
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
    magazzinoId: v.pipe(v.string(), v.minLength(1, 'Seleziona un magazzino')),
    quantita,
    causale: required,
    data: required,
    note: v.string(),
});

/** Anagrafica articolo: obbligatori nome, SKU e prezzo; i numerici restano string fino al submit. */
export const prodottoSchema = v.object({
    nome: required,
    sku: required,
    categoria: optional,
    fornitoreId: optional,
    costo: optional,
    prezzo: required,
    giacenza: optional,
    scorta: optional,
    unita: optional,
    iva: optional,
    ubicazione: optional,
    descrizione: optional,
});
