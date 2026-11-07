// Contratto di configurazione per-tenant.
// Tutto ciò che può cambiare da un cliente all'altro vive QUI e non nel
// codice dei moduli: brand, tema, moduli attivi, tabelle di dominio,
// numerazioni e lingua. Un nuovo cliente = un nuovo file in tenants/.

import type { ModuleId } from '../app/moduleIds';
import type { ThemeTokens } from './theme';
import type { Language } from '../i18n';

export interface Option<V extends string | number = string> {
    value: V;
    label: string;
}

export interface AliquotaIva extends Option<number> {
    /** Natura IVA per operazioni non imponibili/esenti (FatturaPA), es. "N2.1". */
    natura?: string;
}

/** Categoria merceologica: icona Font Awesome opzionale per tabelle e dettagli. */
export interface CategoriaOption extends Option {
    icon?: string;
}

/** Regola di numerazione documento/codice. Generazione definitiva: backend (spec §2). */
export interface NumberingRule {
    prefix: string;
    /** Ultimo numero considerato già assegnato: il primo suggerito sarà start + 1. */
    start: number;
    /** Zero-padding del progressivo (0 = nessuno). */
    pad: number;
}

export interface TenantConfig {
    /** Identificativo stabile del tenant (chiave di storage, telemetria). */
    id: string;
    brand: {
        /** Nome prodotto mostrato in sidebar, titolo pagina, login. */
        name: string;
        /** URL/asset del logo. Vuoto = logo di default. */
        logo: string;
    };
    company: {
        ragioneSociale: string;
        piva: string;
        indirizzo: string;
        email: string;
    };
    locale: {
        language: Language;
        /** BCP-47 per Intl (numeri, date). */
        intl: string;
        currency: string;
    };
    /** Override dei design token (solo colori hex; gli *-rgb sono derivati). */
    theme: ThemeTokens;
    /** Moduli attivi. Assente = attivo. */
    modules: Partial<Record<ModuleId, boolean>>;
    /** Feature flag per funzionalità opzionali dentro i moduli. */
    features: {
        /** Consente lo scarico oltre la giacenza disponibile. */
        giacenzaNegativa: boolean;
        /** Mostra il blocco account demo nella pagina di login. */
        demoLogin: boolean;
    };
    /** Tabelle di dominio configurabili (future: modificabili da Impostazioni). */
    tables: {
        categorie: CategoriaOption[];
        unita: Option[];
        aliquoteIva: AliquotaIva[];
        terminiPagamento: Option[];
        metodiPagamento: Option[];
    };
    numbering: {
        sku: NumberingRule;
        ordine: NumberingRule;
        acquisto: NumberingRule;
        fattura: NumberingRule;
    };
    /** Righe per pagina delle tabelle elenco. */
    pageSize: number;
}

/** Override parziale profondo: un tenant dichiara solo ciò che cambia. */
export type TenantOverride = {
    [K in keyof TenantConfig]?: TenantConfig[K] extends unknown[]
        ? TenantConfig[K]
        : TenantConfig[K] extends object
            ? Partial<TenantConfig[K]>
            : TenantConfig[K];
};
