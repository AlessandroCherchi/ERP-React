// Persistenza del mock "server state" nel browser.
// Senza, ogni ricarica di pagina riportava il dataset demo allo stato
// iniziale: inutilizzabile per collaudi e demo commerciali.
//
// Come funziona: ogni adapter dichiara le sue collezioni con collection();
// il QueryClient salva tutto dopo ogni mutation (lib/queryClient.ts →
// MutationCache). Gli adapter restano codice sincrono su array in memoria,
// nessuna chiamata di persistenza sparsa nelle funzioni.
//
// Isolamento: una chiave per tenant. Schema versionato: se cambia la
// forma dei dati demo si alza SCHEMA_VERSION e i dati vecchi si scartano.
//
// TODO(step Backend): sparisce insieme ai mock. La cache offline vera è
// RxDB con retention e recovery (spec §9), non localStorage.

import { safeStorage } from '../storage';
import { getConfig } from '../../config/configStore';

// v2: Prodotto.fornitore (nome) → Prodotto.fornitoreId (relazione per id)
const SCHEMA_VERSION = 2;
const registry = new Map<string, unknown[]>();

function prefix(): string {
    return `erp.${getConfig().id}.db.v${SCHEMA_VERSION}.`;
}

/**
 * Collezione persistita: restituisce l'array salvato o, al primo avvio,
 * una copia profonda del seed. L'array restituito è quello da mutare.
 */
export function collection<T>(name: string, seed: readonly T[]): T[] {
    const raw = safeStorage.get(prefix() + name);
    let data: T[];
    try {
        data = raw ? (JSON.parse(raw) as T[]) : structuredClone(seed as T[]);
    } catch {
        data = structuredClone(seed as T[]);
    }
    registry.set(name, data);
    return data;
}

/** Primo id libero di una collezione con campo numerico `id`. */
export function nextIdOf(rows: readonly { id: number }[]): number {
    return rows.reduce((max, r) => (r.id > max ? r.id : max), 0) + 1;
}

/** Salva tutte le collezioni registrate. Quota piena = si continua in memoria. */
export function saveAll(): void {
    const p = prefix();
    for (const [name, data] of registry) safeStorage.set(p + name, JSON.stringify(data));
}

/** Cancella i dati demo del tenant corrente; al ricaricamento si riparte dal seed. */
export function resetDemoData(): void {
    for (const key of safeStorage.keys(`erp.${getConfig().id}.db.`)) safeStorage.remove(key);
}

/** Latenza di rete simulata: l'interfaccia deve già gestire gli stati di attesa. */
export function delay(ms = 120): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}
