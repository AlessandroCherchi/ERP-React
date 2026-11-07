/** Voce del registro attività. */
export interface AuditEntry {
    id: number;
    /** ISO timestamp. */
    at: string;
    userId: string;
    userName: string;
    /** Icona Font Awesome dell'azione. */
    icon: string;
    /** Descrizione leggibile, es. "Ordine ORD-3097 confermato". */
    text: string;
    /** Modulo di riferimento (per filtri e link). */
    modulo: string;
}

/** Descrittore dichiarato da una mutation: cosa scrivere a registro se riesce. */
export type AuditDescriptor<TData, TVars> = (data: TData, vars: TVars) => Pick<AuditEntry, 'icon' | 'text' | 'modulo'>;
