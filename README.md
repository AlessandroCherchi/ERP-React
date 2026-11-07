# ERP-React

Gestionale di magazzino enterprise, multi-tenant e personalizzabile per cliente.

| Cartella | Contenuto |
|---|---|
| `erp-react/` | Frontend React 19 + Vite 8 + TypeScript strict |
| `documentazione/` | Specifica architetturale frontend v3.1 |
| `vecchia versione/` | Prototipo HTML/JS originale (riferimento visivo, non in build) |

## Avvio
```bash
cd erp-react
npm install
npm run dev
```

Roadmap e stato: [`erp-react/MIGRATION.md`](erp-react/MIGRATION.md).

## Comandi
| Comando | Cosa fa |
|---|---|
| `npm run dev` | sviluppo su http://localhost:5173 |
| `npm test` | test (dominio, permessi, config, smoke di tutte le route) |
| `npm run typecheck` | TypeScript strict |
| `npm run lint` | oxlint |
| `npm run build` | build di produzione |

Accesso demo: `owner@demo.it`, `admin@demo.it`, `contabilita@demo.it`,
`magazzino@demo.it`, `viewer@demo.it` — password `demo`.

Personalizzazione per cliente: [`erp-react/CUSTOMIZZAZIONE.md`](erp-react/CUSTOMIZZAZIONE.md).
