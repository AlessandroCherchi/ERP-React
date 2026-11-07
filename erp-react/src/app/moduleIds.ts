/** Identificativi dei moduli del prodotto. Chiavi di TenantConfig.modules. */
export const MODULE_IDS = [
    'dashboard',
    'vendite',
    'acquisti',
    'inventario',
    'clienti',
    'fornitori',
    'fatture',
    'contabilita',
    'report',
    'impostazioni',
] as const;

export type ModuleId = (typeof MODULE_IDS)[number];
