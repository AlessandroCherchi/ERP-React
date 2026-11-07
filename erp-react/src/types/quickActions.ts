// Form values delle azioni rapide dashboard — porting 1:1 dei data-field
// dei modali in dashboard.html. Valori numerici restano string (come
// l'originale ERPUI.readFields): parsing con parseNum solo al calcolo/salvataggio.

// L'ordine non è più una quick action "finta": ha un dominio suo
// (types/ordine.ts) e la Dashboard riusa lo stesso modale della pagina
// Vendite, come già fa con cliente e prodotto.

export interface FatturaForm {
    cliente: string;
    numero: string;
    tipo: string;
    data: string;
    scadenza: string;
    pagamento: string;
    imponibile: string;
    iva: string;
    note: string;
}

export const EMPTY_FATTURA: FatturaForm = {
    cliente: '', numero: '', tipo: 'fattura', data: '',
    scadenza: '30', pagamento: 'bonifico', imponibile: '', iva: '22', note: '',
};

/**
 * Campi del prodotto, condivisi fra la quick action "Aggiungi Prodotto"
 * della Dashboard e il CRUD della pagina Inventario (stesso modale in
 * entrambi i posti — vedi components/inventario/ProdottoFormFields).
 */
export interface ProdottoForm {
    nome: string;
    sku: string;
    categoria: string;
    fornitore: string;
    costo: string;
    prezzo: string;
    giacenza: string;
    scorta: string;
    unita: string;
    iva: string;
    /** Posizione a magazzino, es. "A-12-3". */
    ubicazione: string;
    descrizione: string;
}

export const EMPTY_PRODOTTO: ProdottoForm = {
    nome: '', sku: '', categoria: 'Elettronica', fornitore: '',
    costo: '', prezzo: '', giacenza: '', scorta: '', unita: 'pz', iva: '22',
    ubicazione: '', descrizione: '',
};

export interface ReportForm {
    tipo: string;
    periodo: string;
    dal: string;
    al: string;
    formato: string;
}

export const EMPTY_REPORT: ReportForm = {
    tipo: 'fatturato', periodo: '30d', dal: '', al: '', formato: 'csv',
};
