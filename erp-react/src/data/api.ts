// Selezione dell'implementazione del data layer.
// TODO(step Backend): `export const api: DataApi = import.meta.env.VITE_API_URL
//   ? createHttpApi(import.meta.env.VITE_API_URL) : mockApi;`
// Nessuna pagina va toccata per il passaggio.

import type { DataApi } from './contracts';
import * as clienti from '../lib/mockApi/clienti';
import * as fornitori from '../lib/mockApi/fornitori';
import * as inventario from '../lib/mockApi/inventario';
import * as ordini from '../lib/mockApi/ordini';
import * as utenti from '../lib/mockApi/utenti';
import * as acquisti from '../lib/mockApi/acquisti';
import * as fatture from '../lib/mockApi/fatture';
import * as audit from '../lib/mockApi/audit';
import * as magazzini from '../lib/mockApi/magazzini';
import * as conte from '../lib/mockApi/conte';

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
        listRef: fornitori.fetchFornitoriRef,
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
        trasferisci: inventario.trasferisci,
        listMagazzini: magazzini.fetchMagazzini,
        createMagazzino: magazzini.createMagazzino,
        updateMagazzino: magazzini.updateMagazzino,
        removeMagazzino: magazzini.deleteMagazzino,
        listConte: conte.fetchConte,
        apriConta: conte.apriConta,
        salvaConteggi: conte.salvaConteggi,
        chiudiConta: conte.chiudiConta,
        annullaConta: conte.annullaConta,
    },
    ordini: {
        list: ordini.fetchOrdini,
        create: ordini.createOrdine,
        update: ordini.updateOrdine,
        remove: ordini.deleteOrdine,
        cambiaStato: ordini.cambiaStatoOrdine,
    },
    utenti: {
        list: utenti.fetchUtenti,
        invite: utenti.invitaUtente,
        update: utenti.aggiornaUtente,
    },
    acquisti: {
        list: acquisti.fetchAcquisti,
        create: acquisti.createAcquisto,
        createBatch: acquisti.createAcquistiBatch,
        update: acquisti.updateAcquisto,
        remove: acquisti.deleteAcquisto,
        cambiaStato: acquisti.cambiaStatoAcquisto,
        ricevi: acquisti.riceviAcquisto,
    },
    fatture: {
        list: fatture.fetchFatture,
        listIncassi: fatture.fetchIncassi,
        create: fatture.createFattura,
        update: fatture.updateFattura,
        remove: fatture.deleteFattura,
        emetti: fatture.emettiFattura,
        inviaSdi: fatture.inviaSdi,
        registraIncasso: fatture.registraIncasso,
        eliminaIncasso: fatture.eliminaIncasso,
    },
    audit: {
        list: audit.fetchAudit,
    },
};

export const api: DataApi = mockApi;

/** Errori di dominio che le pagine possono riconoscere (instanceof). */
export { DisponibilitaInsufficienteError } from '../lib/mockApi/inventario';

/** Ripristino del dataset dimostrativo (solo mock: col backend sparisce). */
export { resetDemoData } from '../lib/mockApi/db';
