# Roadmap migrazione → Specifica v3.1

Stato: **Step 6 + Fase A completati** (scaffold, Login, Dashboard, Clienti, Inventario, Fornitori, Vendite;
piattaforma configurabile per tenant). Roadmap frontend: fasi A→F, backend dopo.

## Step 1 — DONE
- Vite 8 + React 19.2 + TS strict (`strict`, `noImplicitAny`, `noUncheckedIndexedAccess`)
- React Router v7, modalità Data (unica, come da spec §1)
- TanStack Query v5 provider (nessuna query reale ancora — nessun backend)
- Zustand `uiStore` (stato effimero UI)
- Valibot `useValidatedForm` (domain validation layer §3)
- Design system portato 1:1: tokens.css, erp-ui.css, componenti
  `Toast`, `Modal`, `Confirm`, `FormField`, `Button`
- Login/Signup portati pixel-1:1 (verificato via screenshot headless)
- Tipi contratto API (`ApiResponse`/`ApiError`, §4)

## Step 2 — Dashboard — DONE
- Porting `dashboard.html/js` → componenti React + route `/dashboard`
- Layout condiviso `AppLayout`/`Sidebar`/`Topbar`
- Grafici canvas (`RevenueChart`, `DonutChart`), azioni rapide, KPI animati

## Step 3 — Clienti (CRUD) — DONE
- Porting `clienti.html/js` → componenti React + route `/clienti`
- CRUD completo su mock adapter, `ClientFormFields` condiviso con la Dashboard
- Permission matrix §5: applicata nella Fase A (vedi sotto)

## Step 4 — Inventario (CRUD + movimenti) — DONE
- Route `/inventario`, voce di sidebar attivata
- CRUD articoli su `mockApi/inventario` (stessa firma di `mockApi/clienti`,
  così il passaggio al backend non tocca i componenti)
- **Stato di magazzino derivato**, non persistito: `statoProdotto(giacenza, scorta)`
  → `disponibile | sotto-scorta | esaurito`. Evita che un flag salvato vada
  fuori sync con la quantità reale dopo un carico/scarico
- **Registro movimenti**: la giacenza dopo la creazione cambia solo tramite
  `MovimentoModal` (carico/scarico/rettifica) — nel modale di modifica il
  campo giacenza è in sola lettura. Anteprima e persistenza usano la stessa
  funzione `applicaMovimento()`, così non possono divergere
- `ProdottoModal` + `ProdottoFormFields` condivisi con la quick action
  "Aggiungi Prodotto" della Dashboard (stesso pattern di `ClientModal`);
  il vecchio `components/dashboard/modals/ProdottoModal.tsx` è stato rimosso
- La quick action della Dashboard ora scrive nel catalogo reale e lo SKU
  suggerito è derivato dai dati (`prossimoSku`), non da un contatore di
  pagina: due contatori indipendenti assegnavano lo stesso SKU

### Nota architetturale — CSS
`styles/app-shell.css` raccoglie il chrome condiviso (sidebar, topbar, KPI,
pannelli, tabelle, paginazione, pannello dettaglio, empty state, responsive),
estratto **verbatim** da `clienti.css`. La pagina Inventario carica
`app-shell.css` + `inventario.css` (solo ciò che è suo) invece di ripetere
tutto: 17 kB di CSS contro i 21 kB di Clienti, a parità di chrome e con più
funzionalità.

> ~~TODO(cleanup): migrare anche `dashboard.css` e `clienti.css`~~ — **fatto
> nello Step 6**, insieme alla correzione dell'overflow che quella
> duplicazione aveva reso invisibile su Clienti. Vedi «Consolidamento CSS».

## Step 5 — Fornitori (CRUD) — DONE
- Route `/fornitori`, voce di sidebar attivata
- CRUD su `mockApi/fornitori` (stessa firma di clienti/inventario)
- **Fornitore promosso a relazione**: nel modale prodotto il campo non è più
  testo libero ma una select sull'anagrafica (solo fornitori attivi). Un
  articolo che punta a un fornitore non più attivo continua a mostrarlo,
  altrimenti la select lo azzererebbe in silenzio al primo salvataggio
- Il pannello dettaglio fornitore elenca gli articoli di magazzino collegati;
  l'eliminazione avvisa quanti articoli resterebbero senza fornitore

### Riuso invece di duplicazione
La spec §5 tratta "Clienti/fornitori" come un modulo solo, e infatti le due
anagrafiche condividono davvero il codice:

| Estratto | Da | Usato da |
|---|---|---|
| `types/anagrafica.ts` | Cliente | Cliente, Fornitore |
| `components/anagrafica/AnagraficaFormFields` | `ClientFormFields` | Clienti, Fornitori, quick action Dashboard |
| `components/ui/Pagination` | Client/Product table | Clienti, Inventario, Fornitori |
| `components/ui/DetailPanelShell` | `ClientDetailPanel` | Fornitori (migrazione delle altre: TODO) |
| `lib/tableUtils.ts` | logica ripetuta nelle pagine | Fornitori (idem) |
| `.row--alert`, `.select-box--toolbar`, `.movement-list` | `inventario.css` | `app-shell.css` |

Costo reale della pagina nuova: **0,4 kB di CSS** e nessun componente di
tabella/form riscritto.

> TODO(cleanup): `ClientDetailPanel` e `ProductDetailPanel` non sono ancora
> passati a `DetailPanelShell`, e Clienti/Inventario non usano ancora
> `tableUtils`. Sono migrazioni meccaniche, rimandate per non toccare due
> pagine già validate nello stesso passaggio.

## Step 6 — Vendite / Ordini — DONE

Prima entità del progetto che non è un'anagrafica: testata + righe + ciclo
di vita. Route `/vendite`, voce di sidebar attivata (non è più uno stub).

### Cosa vive nel dominio e non nelle pagine
`types/ordine.ts` tiene tre regole che altrimenti si sarebbero sparse
nell'interfaccia — e che il backend dovrà riusare parola per parola:

| Regola | Perché lì |
|---|---|
| `totaliOrdine()` / `imponibileRiga()` | i totali sono **derivati, mai persistiti** (stessa scelta di `statoProdotto`). Arrotondamento in un punto solo e **per riga**, come vuole la prassi fiscale |
| `TRANSIZIONI` (macchina degli stati) | una tabella invece di condizioni sparse: è ciò che impedisce a un ordine consegnato di tornare in bozza e scaricare due volte il magazzino |
| `impegnaMagazzino()` | unico posto in cui è scritto quando la merce è "uscita": la mock API decide se scaricare o stornare, l'interfaccia lo spiega all'utente |

`inRitardo()` è derivato dalla data e non da un flag: un flag salvato
diventerebbe falso il giorno dopo senza che nessuno lo tocchi.

### Aggancio al magazzino
La roadmap prevedeva «righe ordine che scaricano il magazzino: riusa
`registraMovimento`». Il riuso c'è, ma spostato di un livello:

- `mockApi/inventario.ts` espone `movimentaOrdine()`, che verifica **tutte**
  le righe e poi le applica — tutto o niente. Un ordine di dieci righe di cui
  una scoperta non deve lasciare nove articoli scaricati e il documento
  ancora in bozza, e questo con un ciclo di `registraMovimento()` lato
  chiamante non era ottenibile.
- Il magazzino resta l'unico proprietario delle giacenze: la pagina Vendite
  non scrive mai `giacenza`, chiede una movimentazione. I carichi/scarichi
  generati dagli ordini finiscono nello stesso registro dei movimenti
  manuali e si leggono nel pannello dettaglio dell'articolo.
- `Movimento.ordineId` collega movimento e documento. La domanda "questo
  ordine ha già scaricato?" si risponde leggendo il registro, non un flag
  sull'ordine che potrebbe divergere: è ciò che rende sicuri sia il doppio
  scarico sia il doppio storno in annullamento.
- Giacenza insufficiente non è un errore generico:
  `DisponibilitaInsufficienteError` porta con sé gli articoli scoperti e il
  toast dice *quali* e *di quanto*.

Invariante del dataset demo: un ordine in stato non terminale **o** ha i suoi
movimenti nel registro (`ordineId` sui movimenti già presenti in
`mockApi/inventario.ts`) **oppure** è una bozza. Così qualunque annullamento
fatto dall'interfaccia storna esattamente ciò che era stato scaricato.

### Scelte d'interfaccia
- **Nessuna select "stato iniziale"** nel form: un ordine nasce in bozza e la
  conferma è un'azione a sé, perché è quella che muove il magazzino e può
  fallire. Due strade per lo stesso effetto contabile sono una di troppo.
- **Modifica solo sulle bozze**, **eliminazione solo su bozze e annullati**:
  un documento che ha generato movimenti resta agli atti. I pulsanti non
  spariscono, si disabilitano con il `title` che spiega il perché.
- **Editor righe** (`RigheOrdineEditor`): l'articolo si sceglie dal catalogo,
  mai a testo libero — è ciò che permette di conoscere prezzo, unità, IVA e
  giacenza senza chiederli all'operatore. Quantità/prezzo/sconto restano
  modificabili perché sono la parte negoziata. Aggiungere due volte lo stesso
  articolo incrementa la riga invece di crearne una seconda.
- La riga porta con sé `sku/nome/unita/iva`: **snapshot, non join**. Un
  ordine già emesso deve continuare a dire cosa è stato venduto e a quanto
  anche se domani l'articolo viene rinominato o riprezzato.

### Riuso invece di duplicazione
| Estratto | Usato da |
|---|---|
| `components/ui/DetailPanelShell`, `Pagination`, `FormField` | pannello, tabella e form ordini: nessun componente nuovo di infrastruttura |
| `lib/tableUtils` | filtri/ordinamento/paginazione della pagina |
| `app-shell.css` | tutto il chrome: `vendite.css` sono 6 kB di soli stati, tag e editor righe |
| `OrdineModal` | pagina Vendite **e** quick action della Dashboard |

La quick action "Nuovo Ordine" della Dashboard non è più finta: crea un
documento vero nello stesso registro (stesso pattern di cliente e prodotto),
e il numero proposto è derivato dai dati con `prossimoNumeroOrdine()`. Il
vecchio `components/dashboard/modals/OrdineModal.tsx` — con i campi "numero
articoli" e "importo" battuti a mano — è stato rimosso, insieme a
`OrdineForm`/`EMPTY_ORDINE`/`ordineSchema` che servivano solo a lui.

### Consolidamento CSS (correzione di un bug di layout)
Sintomo: su **Inventario** e **Fornitori** la pagina sforava a destra —
topbar, KPI e toolbar tagliate — mentre **Clienti** era corretta.

Causa: `.main-content` è un flex item e nasce con `min-width: auto`, quindi
non scende sotto il min-content dei suoi figli. La `.kpi-grid` a
`repeat(4, 1fr)` (cioè `minmax(auto, 1fr)`) aveva un min-content di ~1306 px
contro i ~1014 px disponibili, e trascinava **tutta** la colonna oltre il
viewport. Clienti non sforava solo perché le sue etichette KPI sono più
corte: fortuna, non correttezza.

Correzione in `app-shell.css`, unico punto:
- `.main-content { min-width: 0 }` — chi deve scorrere ha già il suo
  `overflow-x` (`.table-wrapper`);
- `.kpi-grid { repeat(4, minmax(0, 1fr)) }` e `.kpi-info { min-width: 0 }`;
- `.search-box { flex: 0 1 240px }` — nella topbar la ricerca cede spazio al
  titolo invece di spingere fuori campo notifiche e avatar;
- soglia KPI 4→2 colonne portata da 1200 px a **1440 px**: è la larghezza
  sotto la quale quattro card non ci stanno davvero (misurata, non estetica).

Perché il bug era possibile: `clienti.css` (33 kB) e `dashboard.css` (18 kB)
contenevano una **copia identica** dello shell, quindi una correzione al
layout poteva essere applicata a una pagina e non alle altre. Ora tutte e
quattro le pagine caricano `app-shell.css` e tengono solo il proprio:

| File | Prima | Dopo |
|---|---|---|
| `clienti.css` | 33,7 kB | 1,1 kB (solo il wrapper di pagina) |
| `dashboard.css` | 18,1 kB | 6,4 kB (grafici, attività, azioni rapide) |
| **totale CSS** | 110,7 kB | 68,4 kB |

Verificato pagina per pagina in browser: nessun overflow orizzontale a
526 px, 1280 px e 1920 px, e stili condivisi (ombre, raggi, spaziature,
tipografia della tabella) identici fra le quattro pagine.

## Fase A — Fondamenta piattaforma (white-label, ruoli, data layer) — DONE

Obiettivo: rendere il prodotto vendibile e personalizzabile per cliente
senza toccare il codice dei moduli. Guida operativa: `CUSTOMIZZAZIONE.md`.

### Configurazione per tenant — `src/config/`
- `TenantConfig` (`types.ts`): brand, dati azienda, lingua/locale/valuta,
  tema, moduli attivi, feature flag, **tabelle di dominio** (categorie,
  unità, aliquote IVA con natura, termini e metodi di pagamento),
  **numerazioni** (SKU, ordini, fatture: prefisso/progressivo/padding),
  righe per pagina.
- `defaults.ts` = prodotto di serie; `tenants/*.ts` = solo le differenze
  (`TenantOverride`). Esempio completo: `tenants/acme.ts`.
- Selezione: `VITE_TENANT` (build per cliente) o `?tenant=` in sviluppo.
- `configStore.ts` (Zustand): leggibile anche fuori da React; override
  locali persistiti per tenant (base per le Impostazioni, Fase B).
- `numbering.ts` sostituisce `prossimoSku`/`prossimoNumeroOrdine`.

### Tema — `styles/tokens.css` + `config/theme.ts`
- **Tutti** i colori (≈350 letterali in 9 fogli) sostituiti da token
  `var(--erp-*)`. I token `*-rgb` sono derivati in automatico dagli hex
  del tenant: accento e sue trasparenze non possono divergere.
- Grafici canvas: leggono i token al disegno (`readToken`).
- Guardia: `styles/tokens.test.ts` fallisce se un foglio reintroduce un
  colore letterale o usa un token non definito.
- **Bug corretto**: in `app-shell.css` il blocco `@media (max-width: 600px)`
  non era chiuso, quindi «Elementi condivisi» (`.row--alert`,
  `.select-box--toolbar`, `.movement-list`…) stava annidato nella media
  query e valeva solo sotto i 600 px.

### Autenticazione e permessi — `src/auth/`
- Sessione mock con 5 utenti demo, uno per ruolo (password `demo`),
  scadenza, «ricordami», redirect alla pagina richiesta.
- `permissions.ts`: matrice §5 trascritta, 45 test cella per cella.
  Celle «da definire» fissate: *Read propria* → read (filtro dati lato
  backend); *Limitato* (magazzino/ordini) → read + avanzamento
  preparazione/spedizione/consegna, niente conferma/annullo/modifica.
- UI: `usePermissions(resource)`; toolbar, tabelle e pannelli mostrano
  Nuovo/Modifica/Elimina/Movimento solo se consentiti (prop opzionali).
  Azioni rapide della Dashboard filtrate per ruolo e modulo attivo.
- `RequireAuth` su tutte le route applicative.

### Registro moduli e router — `src/app/`
- `modules.ts`: una riga per modulo = route + voce di menu + permesso.
  Sidebar e router generati da qui, filtrati per tenant e ruolo.
- Moduli in roadmap (Acquisti, Fatture, Contabilità, Report, Impostazioni)
  navigabili con pagina «in sviluppo» e badge «presto».
- Pagine di sistema: 404, errore di route (`errorElement`, niente stack
  trace a schermo), accesso negato, modulo non attivo; loader di pagina.
- Icona Dashboard: `fa-grid-2` era Font Awesome **Pro** e non si vedeva.

### i18n — `src/i18n/`
- Dizionari tipizzati (`it` riferimento, `en`), chiavi verificate a
  compile-time, interpolazione `{param}`, lingua dal tenant.
- Migrati: shell, login, pagine di sistema, ruoli. Le pagine dei moduli
  restano da migrare (A.2).

### Data layer — `src/data/`
- `contracts.ts`: interfacce `DataApi`; `api.ts`: implementazione mock
  (punto unico di swap verso HTTP); `hooks.ts`: query e mutation per
  entità con invalidazioni incluse; `queryKeys.ts`.
- Nessuna pagina importa più `lib/mockApi`.
- Mock **persistiti** in localStorage per tenant (`lib/mockApi/db.ts`),
  salvati dal `MutationCache`: i dati sopravvivono al ricaricamento.
- Formattatori locale/valuta-aware (`configureFormat`).

### Login
- Flusso reale (mock): validazione, stato di invio, errore accessibile,
  switch «ricordami» accessibile, pannello account demo (feature flag).
- Il retro non crea account: in un gestionale enterprise gli utenti sono
  invitati dall'amministratore.

### Security / tooling
- Font Poppins e Font Awesome **self-hosted** via npm: CDN rimossi (§13).
- Vitest + Testing Library: test di dominio (ordini, magazzino, permessi,
  config, tema, i18n, token) e smoke test che monta ogni modulo per ogni
  ruolo e verifica guard, permessi e tenant. `npm test`.
- `.nvmrc` (Node 22), script `typecheck`, `test`, `test:watch`.

### A.2 — Componenti elenco riutilizzabili — DONE
- `components/data/`: `DataTable` (colonne dichiarative, ordinamento
  accessibile da tastiera, azioni di riga con motivazione se disabilitate),
  `ListToolbar` + `ToolbarSelect`, `KpiGrid`/`KpiCard`, `EntityCell`.
- `lib/listQuery.ts`: pipeline pura filtri → ricerca → sort → pagina,
  usata da tabelle ed export. `lib/csv.ts`: export tipizzato per colonne.
- `hooks/useListState`: ricerca/filtri/ordinamento/pagina **nell'URL**
  (link condivisibili, back del browser). `useCrudDialogs`, `useDeleteConfirm`.
- Pannelli dettaglio tutti su `DetailPanelShell` + `PanelActions`
  (azioni per permesso, disabilitate con motivo).
- Le 4 pagine elenco riscritte sui componenti generici: eliminati 8
  componenti Table/Toolbar duplicati (~1.100 righe).
- **Prodotto → fornitore per id** (`fornitoreId`), non più per nome: rinominare
  un fornitore non rompe il collegamento. Schema mock v2.
- Icone categoria dal config del tenant; numeri formattati col locale.
- Residuo: testi delle pagine modulo nei dizionari i18n (le pagine nuove
  nascono già tradotte).

## Roadmap frontend (backend in secondo piano)
- **B — Impostazioni e tabelle base**: azienda, utenti/ruoli, numerazioni,
  tabelle, branding, moduli attivi, campi personalizzati, modelli di stampa.
- **C — Acquisti**: ordini fornitore, ricevimento merce con carico
  automatico, riordino da sotto scorta.
- **D — Magazzino avanzato**: multi-magazzino/ubicazioni, trasferimenti,
  lotti/seriali/scadenze, inventario fisico, valorizzazione.
- **E — Ciclo attivo**: DDT, fatture/NC (bozze; SDI backend), scadenzario.
- **F — Report, Dashboard su dati reali, audit, notifiche, ricerca globale.**

## Step 7 — RxDB + Sync Coordinator
- Schema RxDB per cache/outbox (customer/order/invoice/product draft)
- Sync Coordinator: leader election, lease/fencing, stati pending→succeeded
- Idempotency key su ogni mutation (§8)

## Step 8 — Backend (non esiste ancora)
- Provisioning Supabase/Postgres, RLS multi-tenant (§2)
- Contract API versionato `/api/v1`, envelope SUCCESS/ERROR (§4)
- Implementare `DataApi` (`src/data/contracts.ts`) con client HTTP e
  selezionarlo in `src/data/api.ts`: nessuna pagina da toccare
- Generazione SKU lato server (unico punto in cui l'unicità è garantita
  in concorrenza — vedi `prossimoSku`)
- Permission matrix §5: lato UI già applicata (Fase A); qui RLS/RPC +
  test Given/When/Then lato server

## Step 9 — Money/Fiscalità/SDI
- Base unit importi (decimal/minor units), rounding mode (§10)
- Contratto FatturaPA/SDI backend-driven (§11), nessuna logica fiscale in client

## Step 10 — Security/Observability/Go-live gate
- CSP §13 (self-hostare font/icone, rimuovere CDN cdnjs/Google Fonts)
- Sentry/OpenTelemetry (§14)
- Acceptance criteria §15, gate go-live §20

## Prossime pagine (ordine suggerito)
Anagrafiche e ciclo dell'ordine sono completi (Clienti, Fornitori,
Inventario, Vendite). Restano, in ordine di dipendenza:

1. **Fatture** — nasce dagli ordini consegnati; richiede §10 (money in minor
   units) prima di §11 (SDI). È il primo modulo in cui l'arrotondamento su
   `number` non è più accettabile: vedi il TODO in `types/ordine.ts`
2. **Contabilità** e **Report** — leggono da tutto il resto. I KPI statici
   della Dashboard (`KPI` in `pages/Dashboard.tsx`) andranno agganciati ai
   registri reali in quell'occasione

## Note aperte
- ~~CDN Font Awesome/Google Fonts~~ — self-hosted nella Fase A (§13).
- `assett/prismatic background 4Risorsa 3.svg` genera un warning Vite
  a build time (riferimento interno all'SVG) — non bloccante, innocuo.
- Touch target: **risolto** in `base.css` (§ TOUCH TARGET). L'area sensibile
  dei pulsanti è portata a 44 px con uno pseudo-elemento trasparente, quindi
  la dimensione *visiva* — e con essa la densità di tutte le pagine — resta
  quella originale. La regola vive in `base.css` e non in `app-shell.css`
  perché è l'unico foglio caricato da ogni route (`main.tsx`), compreso il
  Login che non importa `app-shell.css`.
  Risultato: icone topbar e chiudi-modale 44×44 pieni; azioni di riga e
  paginazione 44 px in altezza e 36 px in larghezza — l'espansione
  orizzontale è limitata a metà del gap perché due target adiacenti non si
  sovrappongano (in tabella l'ultimo pulsante è "Elimina"). Verificato che
  non restino zone morte fra un target e l'altro.
  Per arrivare a 44×44 pieni anche lì servirebbe allargare il gap da 6 a
  14 px: è l'unico passo che cambierebbe la spaziatura visibile, quindi non
  è stato fatto. Nota: 36×44 supera comunque il minimo WCAG 2.2 AA
  (SC 2.5.8, 24×24); i 44×44 sono il livello AAA (SC 2.5.5).
