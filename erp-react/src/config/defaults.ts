// Configurazione base: valori del prodotto "di serie".
// I tenant in tenants/ dichiarano solo le differenze (TenantOverride).

import type { TenantConfig } from './types';

export const DEFAULT_CONFIG: TenantConfig = {
    id: 'default',
    brand: {
        name: 'ERP Suite',
        logo: '',
    },
    company: {
        ragioneSociale: 'Azienda Demo S.r.l.',
        piva: 'IT00000000000',
        indirizzo: 'Via Roma 1, 00100 Roma (RM)',
        email: 'amministrazione@demo.it',
    },
    locale: {
        language: 'it',
        intl: 'it-IT',
        currency: 'EUR',
    },
    theme: {},
    modules: {},
    features: {
        demoLogin: true,
        multiMagazzino: true,
    },
    tables: {
        categorie: [
            { value: 'Elettronica', label: 'Elettronica', icon: 'fa-microchip' },
            { value: 'Componenti', label: 'Componenti', icon: 'fa-gears' },
            { value: 'Illuminazione', label: 'Illuminazione', icon: 'fa-lightbulb' },
            { value: 'Networking', label: 'Networking', icon: 'fa-network-wired' },
            { value: 'Accessori', label: 'Accessori', icon: 'fa-screwdriver-wrench' },
        ],
        unita: [
            { value: 'pz', label: 'pz — pezzi' },
            { value: 'cf', label: 'cf — confezioni' },
            { value: 'kg', label: 'kg — chilogrammi' },
            { value: 'm', label: 'm — metri' },
            { value: 'lt', label: 'lt — litri' },
        ],
        aliquoteIva: [
            { value: 22, label: '22% — ordinaria' },
            { value: 10, label: '10% — ridotta' },
            { value: 5, label: '5% — ridotta' },
            { value: 4, label: '4% — minima' },
            { value: 0, label: '0% — non imponibile', natura: 'N3.1' },
        ],
        terminiPagamento: [
            { value: '0', label: 'Pagamento immediato' },
            { value: '30', label: '30 giorni data fattura' },
            { value: '60', label: '60 giorni data fattura' },
            { value: '90', label: '90 giorni data fattura' },
        ],
        metodiPagamento: [
            { value: 'bonifico', label: 'Bonifico bancario' },
            { value: 'riba', label: 'RIBA' },
            { value: 'carta', label: 'Carta di credito' },
            { value: 'contanti', label: 'Contanti' },
        ],
    },
    numbering: {
        sku: { prefix: 'SKU-', start: 4500, pad: 0 },
        ordine: { prefix: 'ORD-', start: 3000, pad: 0 },
        acquisto: { prefix: 'OA-', start: 2300, pad: 0 },
        fattura: { prefix: '', start: 0, pad: 4 },
    },
    pageSize: 10,
};
