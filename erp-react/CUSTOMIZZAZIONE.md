# Personalizzare il gestionale per un cliente

Due livelli:

1. **Da interfaccia** — *Impostazioni* (owner/admin): brand, logo, colori,
   moduli, tabelle, numerazioni, utenti, lingua. Le modifiche sono salvate
   per tenant. *Impostazioni → Dati → Esporta JSON* produce il punto di
   partenza per il file del tenant.
2. **Da codice** (build dedicata al cliente) — come sotto.

Tutto ciò che cambia da un cliente all'altro sta in `src/config/`.
Il codice dei moduli non va toccato.

## 1. Creare il tenant

`src/config/tenants/<cliente>.ts` — si dichiarano **solo** le differenze dal
prodotto di serie (`src/config/defaults.ts`):

```ts
import type { TenantOverride } from '../types';

export const rossi: TenantOverride = {
    id: 'rossi',
    brand: { name: 'Rossi Gestionale', logo: '/brand/rossi.svg' },
    company: { ragioneSociale: 'Rossi S.r.l.', piva: 'IT01234567890', indirizzo: '…', email: 'admin@rossi.it' },
    theme: { '--erp-accent': '#0b6e4f', '--erp-accent-light': '#13906a', '--erp-accent-dark': '#084d37' },
    modules: { contabilita: false, report: false },
    tables: { categorie: [{ value: 'Vernici', label: 'Vernici' }] },
    numbering: { sku: { prefix: 'RS-', start: 0, pad: 5 } },
};
```

Registrarlo in `src/config/tenants/index.ts`.

## 2. Cosa si può personalizzare

| Chiave | Effetto |
|---|---|
| `brand` | nome in sidebar, login e titolo; logo (file in `public/`) |
| `company` | dati azienda (login, documenti) |
| `locale` | lingua UI (`it`/`en`), formati numeri/date, valuta |
| `theme` | qualsiasi token colore di `src/styles/tokens.css`, più `--erp-radius`, `--erp-radius-lg`, `--erp-font`. Le varianti `-rgb` si calcolano da sole |
| `modules` | `false` = modulo nascosto dal menu e rotta bloccata |
| `features` | feature flag (es. `demoLogin`) |
| `tables` | categorie, unità di misura, aliquote IVA (con natura), termini e metodi di pagamento. Un array dichiarato **sostituisce** quello di serie |
| `numbering` | prefisso, progressivo iniziale e padding di SKU, ordini, fatture |
| `pageSize` | righe per pagina delle tabelle |

## 3. Build per il cliente

```bash
VITE_TENANT=rossi npm run build
```

In sviluppo: `http://localhost:5173/?tenant=rossi` (la scelta resta salvata
nel browser).

## 4. Regole per chi sviluppa

- **Colori**: mai hex o `rgb()` nei CSS, solo `var(--erp-*)`. Il test
  `src/styles/tokens.test.ts` blocca le eccezioni.
- **Testi**: chiavi in `src/i18n/it.ts` + traduzione in `en.ts` (il compilatore
  segnala le chiavi mancanti).
- **Elenchi di dominio**: dal config (`useConfig().tables`), mai costanti nel codice.
- **Nuovo modulo**: una riga in `src/app/modules.ts` (route, icona, voce di
  menu, risorsa della permission matrix) + la pagina.
- **Dati**: le pagine usano solo gli hook di `src/data/`.
