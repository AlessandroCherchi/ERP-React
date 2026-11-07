// Selezione dell'implementazione del data layer.
// TODO(step Backend): `export const api: DataApi = import.meta.env.VITE_API_URL
//   ? createHttpApi(import.meta.env.VITE_API_URL) : mockApi;`
// Nessuna pagina va toccata per il passaggio.

import type { DataApi } from './contracts';
import * as clienti from '../lib/mockApi/clienti';
import * as fornitori from '../lib/mockApi/fornitori';
import * as inventario from '../lib/mockApi/inventario';
import * as ordini from '../lib/mockApi/ordini';

const mockApi: DataApi = {
    clienti: {
        list: clienti.fetchClienti,
        listSelezionabili: clienti.fetchClientiSelezionabili,
        create: clienti.createCliente,
        update: clienti.updateCliente,
        remove: clienti.deleteCliente,
    },
    fornitori: {
        list: fornitori.fetchFornitori,
        listNomiAttivi: fornitori.fetchFornitoriNomi,
        create: fornitori.createFornitore,
        update: fornitori.updateFornitore,
        remove: fornitori.deleteFornitore,
    },
    magazzino: {
        listProdotti: inventario.fetchProdotti,
        listMovimenti: inventario.fetchMovimenti,
        createProdotto: inventario.createProdotto,
        updateProdotto: inventario.updateProdotto,
        removeProdotto: inventario.deleteProdotto,
        registraMovimento: inventario.registraMovimento,
    },
    ordini: {
        list: ordini.fetchOrdini,
        create: ordini.createOrdine,
        update: ordini.updateOrdine,
        remove: ordini.deleteOrdine,
        cambiaStato: ordini.cambiaStatoOrdine,
    },
};

export const api: DataApi = mockApi;

/** Errori di dominio che le pagine possono riconoscere (instanceof). */
export { DisponibilitaInsufficienteError } from '../lib/mockApi/inventario';
