# ERP-React — gestionale di magazzino white-label

[![CI](https://github.com/AlessandroCherchi/ERP-React/actions/workflows/ci.yml/badge.svg)](https://github.com/AlessandroCherchi/ERP-React/actions/workflows/ci.yml)

Gestionale di magazzino **multi-tenant e personalizzabile per cliente**: vendite,
acquisti, magazzino multi-sede, fatturazione elettronica (flusso SDI),
contabilità operativa e report. Frontend completo in **React 19 + TypeScript
strict**, progettato per agganciare un backend Supabase/Postgres senza
riscrivere le pagine.

> Stato: frontend completo su adapter dati simulati e persistiti nel browser.
> Backend (Supabase, RLS multi-tenant, SDI reale) in roadmap — vedi
> [`erp-react/MIGRATION.md`](erp-react/MIGRATION.md).

## Funzionalità

| Modulo | Cosa fa |
|---|---|
| **Dashboard** | KPI e grafici su dati reali, attività recenti, avvisi, azioni rapide per ruolo |
| **Vendite** | ordini con ciclo di vita, scarico di magazzino tutto-o-niente alla conferma, storno all'annullamento |
| **Acquisti** | ordini fornitore, ricevimento anche parziale con carico automatico e **costo medio ponderato**, **riordino suggerito** |
| **Inventario** | catalogo, **giacenze per magazzino**, trasferimenti, registro movimenti, **inventario fisico** con rettifiche |
| **Clienti / Fornitori** | anagrafiche con indicatori derivati dai documenti |
| **Fatture** | TD01/TD24/TD04, fatturazione da ordini, numerazione all'emissione, **invio SDI simulato** (scarto 00305, reinvio), incassi, stampa A4 |
| **Contabilità** | scadenzario con **aging**, prima nota incassi, registro IVA vendite |
| **Report** | vendite, magazzino, acquisti, registro attività — tutto esportabile in CSV |
| **Impostazioni** | brand e logo, colori, moduli attivi, tabelle, numerazioni, utenti e ruoli, lingua |

Trasversali: 5 ruoli con **permission matrix** testata, **ricerca globale**,
**centro notifiche**, **registro attività**, filtri condivisibili via URL,
temi per cliente, italiano/inglese.

## Perché è fatto così

- **White-label vero**: tutto ciò che cambia fra clienti è in `TenantConfig`
  (brand, palette, moduli, tabelle, numerazioni) — modificabile da Impostazioni
  o con un file di tenant. Un test impedisce colori letterali nei CSS.
- **Dominio puro e testato**: macchine a stati dichiarative, importi in
  **centesimi interi** con arrotondamento esplicito, **IVA per aliquota** come
  in FatturaPA, stato sempre derivato (mai flag che vanno fuori sync).
- **Backend sostituibile**: le pagine parlano solo con `src/data/` (contratti
  tipizzati + TanStack Query); il passaggio a un'API reale cambia un file.
  Le regole fra layer sono **verificate da test di architettura**.
- **Confine fiscale rispettato**: numerazione, XML e invio SDI sono operazioni
  di backend; il client prepara bozze e mostra esiti (spec v3.1 §2, §11).

Dettagli: [`erp-react/docs/ARCHITETTURA.md`](erp-react/docs/ARCHITETTURA.md).

## Stack

React 19 · TypeScript 6 (strict, `noUncheckedIndexedAccess`) · Vite 8 ·
React Router 7 (data mode) · TanStack Query 5 · Zustand 5 · Valibot ·
Vitest + Testing Library · oxlint · GitHub Actions.

## Avvio

```bash
cd erp-react
npm install
npm run dev
```

Account demo (password `demo`): `owner@demo.it`, `admin@demo.it`,
`contabilita@demo.it`, `magazzino@demo.it`, `viewer@demo.it` — ogni ruolo vede
moduli e azioni diversi. Tenant alternativo: aggiungere `?tenant=acme` all'URL.

## Qualità

- 211 test (dominio, adapter, permessi, architettura, smoke di ogni modulo per ogni ruolo)
- TypeScript strict senza errori, lint a 0 warning, CI su ogni push
- Accessibilità: label associate ai campi, ordinamenti e azioni da tastiera,
  combobox ARIA, grafici con descrizione testuale

## Struttura

| Cartella | Contenuto |
|---|---|
| `erp-react/` | frontend ([guida sviluppatori](erp-react/README.md)) |
| `documentazione/` | specifica architetturale frontend v3.1 |
| `vecchia versione/` | prototipo HTML/JS originale (riferimento) |
