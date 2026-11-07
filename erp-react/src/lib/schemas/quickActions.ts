// Domain validation azioni rapide — Implementation Contract v3.1 §3.
// Stessa regola dell'originale ERPUI.validate: solo required non vuoti
// (i vincoli min/step dei campi numerici restano nativi dell'<input>).

import * as v from 'valibot';

const required = v.pipe(v.string(), v.trim(), v.minLength(1, 'Campo obbligatorio'));
const optional = v.string();

export const fatturaSchema = v.object({
    cliente: required,
    numero: required,
    tipo: optional,
    data: required,
    scadenza: optional,
    pagamento: optional,
    imponibile: required,
    iva: optional,
    note: optional,
});

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

export const reportSchema = v.object({
    tipo: required,
    periodo: optional,
    dal: optional,
    al: optional,
    formato: optional,
});
