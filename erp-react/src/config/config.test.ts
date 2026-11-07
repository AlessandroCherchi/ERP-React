import { describe, expect, it } from 'vitest';
import { formatNumber, nextNumber } from './numbering';
import { hexToRgbTriplet, resolveThemeVars } from './theme';
import { mergeConfig } from './merge';
import { DEFAULT_CONFIG } from './defaults';
import { TENANTS } from './tenants';
import { optionsWithCurrent } from './index';

describe('numerazione', () => {
    const sku = { prefix: 'SKU-', start: 4500, pad: 0 };

    it('prossimo dopo il massimo esistente', () => {
        expect(nextNumber(sku, ['SKU-4501', 'SKU-4510', 'SKU-4502'])).toBe('SKU-4511');
    });

    it('parte da start + 1 se non ci sono codici', () => {
        expect(nextNumber(sku, [])).toBe('SKU-4501');
    });

    it('ignora codici con prefisso diverso (cambio di prefisso)', () => {
        expect(nextNumber({ prefix: 'ACM-', start: 0, pad: 6 }, ['SKU-9999', 'ACM-000041'])).toBe('ACM-000042');
    });

    it('padding', () => {
        expect(formatNumber({ prefix: 'OV-', start: 0, pad: 5 }, 7)).toBe('OV-00007');
    });
});

describe('tema', () => {
    it('hex → tripletta rgb, anche in forma corta', () => {
        expect(hexToRgbTriplet('#a10f0f')).toBe('161, 15, 15');
        expect(hexToRgbTriplet('#fff')).toBe('255, 255, 255');
        expect(hexToRgbTriplet('rosso')).toBeNull();
    });

    it('deriva le -rgb solo per i token che le hanno', () => {
        const vars = resolveThemeVars({ '--erp-accent': '#1f4e9c', '--erp-accent-dark': '#163a75' });
        expect(vars['--erp-accent-rgb']).toBe('31, 78, 156');
        expect(vars['--erp-accent-dark-rgb']).toBeUndefined();
    });
});

describe('merge config tenant', () => {
    it('override parziale di un gruppo, il resto dal default', () => {
        const c = mergeConfig(DEFAULT_CONFIG, { brand: { name: 'X', logo: '' }, numbering: { sku: { prefix: 'A-', start: 0, pad: 0 } } });
        expect(c.brand.name).toBe('X');
        expect(c.numbering.sku.prefix).toBe('A-');
        expect(c.numbering.ordine).toEqual(DEFAULT_CONFIG.numbering.ordine);
    });

    it('le tabelle dichiarate dal tenant sostituiscono quelle di default', () => {
        const c = mergeConfig(DEFAULT_CONFIG, TENANTS.acme!);
        expect(c.tables.categorie.map((x) => x.value)).toEqual(['Ferramenta', 'Elettrico', 'Idraulica', 'Utensileria']);
        expect(c.tables.unita).toEqual(DEFAULT_CONFIG.tables.unita);
        expect(c.modules.contabilita).toBe(false);
    });

    it('optionsWithCurrent conserva un valore fuori tabella', () => {
        const opts = [{ value: 'a', label: 'A' }];
        expect(optionsWithCurrent(opts, 'b').map((o) => o.value)).toEqual(['b', 'a']);
        expect(optionsWithCurrent(opts, 'a')).toBe(opts);
    });
});
