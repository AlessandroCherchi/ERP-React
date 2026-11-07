// Tenant di esempio: dimostra una personalizzazione completa senza
// toccare il codice dei moduli. Attivabile con VITE_TENANT=acme
// oppure, in sviluppo, con ?tenant=acme nell'URL.

import type { TenantOverride } from '../types';

export const acme: TenantOverride = {
    id: 'acme',
    brand: { name: 'ACME Magazzino', logo: '' },
    company: {
        ragioneSociale: 'ACME Distribuzione S.p.A.',
        piva: 'IT11111111111',
        indirizzo: 'Via dell’Industria 10, 20100 Milano (MI)',
        email: 'info@acme.example',
    },
    theme: {
        '--erp-accent': '#1f4e9c',
        '--erp-accent-light': '#2a63c4',
        '--erp-accent-bright': '#4a86e8',
        '--erp-accent-dark': '#163a75',
        '--erp-accent-deep': '#0f2a57',
        '--erp-accent-shadow': '#061630',
        '--erp-gold': '#dbe8ff',
        '--erp-gold-strong': '#2a9df4',
    },
    modules: { contabilita: false },
    tables: {
        categorie: [
            { value: 'Ferramenta', label: 'Ferramenta', icon: 'fa-screwdriver-wrench' },
            { value: 'Elettrico', label: 'Elettrico', icon: 'fa-plug' },
            { value: 'Idraulica', label: 'Idraulica', icon: 'fa-faucet' },
            { value: 'Utensileria', label: 'Utensileria', icon: 'fa-toolbox' },
        ],
    },
    numbering: {
        sku: { prefix: 'ACM-', start: 10000, pad: 6 },
        ordine: { prefix: 'OV-', start: 0, pad: 5 },
        acquisto: { prefix: 'OF-', start: 0, pad: 5 },
    },
};
