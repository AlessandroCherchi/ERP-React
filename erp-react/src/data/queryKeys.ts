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
        nomi: ['fornitori', 'nomi'] as const,
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
};
