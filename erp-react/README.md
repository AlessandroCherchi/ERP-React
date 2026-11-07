# erp-react — frontend

Guida per sviluppatori. Panoramica del prodotto nel [README principale](../README.md).

## Requisiti
Node.js 22 LTS (`.nvmrc`), npm.

## Comandi
| Comando | Cosa fa |
|---|---|
| `npm run dev` | server di sviluppo (http://localhost:5173) |
| `npm test` | Vitest: dominio, adapter, architettura, smoke di tutte le route |
| `npm run test:watch` | test in watch mode |
| `npm run typecheck` | TypeScript strict (`noUncheckedIndexedAccess`) |
| `npm run lint` | oxlint (regole React incluse) |
| `npm run build` | build di produzione in `dist/` |

## Documentazione
| File | Contenuto |
|---|---|
| [`docs/ARCHITETTURA.md`](docs/ARCHITETTURA.md) | layer, flusso dei dati, decisioni tecniche |
| [`CUSTOMIZZAZIONE.md`](CUSTOMIZZAZIONE.md) | personalizzare il prodotto per un cliente |
| [`MIGRATION.md`](MIGRATION.md) | storico delle fasi e roadmap verso il backend |
| [`../documentazione/`](../documentazione/) | specifica architetturale v3.1 (contratto di implementazione) |

## Convenzioni
- Le pagine usano solo gli hook di `src/data/` (verificato da `app/architecture.test.ts`).
- Regole di business in `src/types/` (funzioni pure, senza React) e `src/lib/`.
- Colori solo via token `var(--erp-*)` (verificato da `styles/tokens.test.ts`).
- Testi nuovi in `src/i18n/it.ts` + `en.ts`; elenchi di dominio dal config del tenant.
- Commenti per spiegare il *perché* (vincoli, regole fiscali, scelte), non il *cosa*.
