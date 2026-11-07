// Macchina a stati dichiarativa per i documenti con ciclo di vita.
// Le transizioni stanno in una tabella invece che sparse negli if
// dell'interfaccia: è ciò che impedisce, ad esempio, a un ordine consegnato
// di tornare in bozza e scaricare due volte il magazzino.

export interface StateMachine<S extends string> {
    /** Stati raggiungibili da `from`. Array vuoto = stato terminale. */
    next(from: S): readonly S[];
    canTransition(from: S, to: S): boolean;
    isTerminal(state: S): boolean;
    /** Lancia se la transizione non è ammessa (uso lato "server"/mock). */
    assert(from: S, to: S): void;
}

export function createStateMachine<S extends string>(transitions: Record<S, readonly S[]>): StateMachine<S> {
    return {
        next: (from) => transitions[from],
        canTransition: (from, to) => transitions[from].includes(to),
        isTerminal: (state) => transitions[state].length === 0,
        assert(from, to) {
            if (!transitions[from].includes(to)) throw new Error(`Transizione non ammessa: ${from} → ${to}`);
        },
    };
}
