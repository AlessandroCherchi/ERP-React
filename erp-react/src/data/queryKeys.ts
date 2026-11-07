// Chiavi di cache in un punto solo. Le invalidazioni usano i prefissi
// (qk.clienti.all invalida anche qk.clienti.ref): una mutation non deve
// conoscere tutte le viste derivate di un'entità.

export const qk = {
    clienti: {
        all: ['clienti'] as const,
        ref: ['clienti', 'ref'] as const,
    },
    fornitori: {
        all: ['fornitori'] as const,
        ref: ['fornitori', 'ref'] as const,
    },
    prodotti: {
        all: ['prodotti'] as const,
    },
    movimenti: {
        all: ['movimenti'] as const,
    },
    ordini: {
        all: ['ordini'] as const,
    },
    utenti: {
        all: ['utenti'] as const,
    },
    acquisti: {
        all: ['acquisti'] as const,
    },
    fatture: {
        all: ['fatture'] as const,
    },
    incassi: {
        all: ['incassi'] as const,
    },
    audit: {
        all: ['audit'] as const,
    },
};
