// Registro attività (audit trail) — mock. In produzione è una tabella
// append-only scritta dal backend nella stessa transazione della mutazione
// (spec §14: correlationId, redaction dei dati personali).

import { collection, delay, nextIdOf } from './db';
import type { AuditEntry } from '../../types/audit';

const MAX_ENTRIES = 500;
const store = collection<AuditEntry>('audit', []);
let nextId = nextIdOf(store);

export function recordAudit(entry: Omit<AuditEntry, 'id'>): void {
    store.unshift({ ...entry, id: nextId++ });
    if (store.length > MAX_ENTRIES) store.length = MAX_ENTRIES;
}

export async function fetchAudit(): Promise<AuditEntry[]> {
    await delay(60);
    return store.slice();
}
