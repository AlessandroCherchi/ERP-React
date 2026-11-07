import { describe, expect, it } from 'vitest';
import { DICTIONARIES, translate } from './index';

function keys(obj: object, prefix = ''): string[] {
    return Object.entries(obj).flatMap(([k, v]) =>
        typeof v === 'string' ? [`${prefix}${k}`] : keys(v as object, `${prefix}${k}.`)
    );
}

describe('i18n', () => {
    it('tutte le lingue hanno le stesse chiavi dell’italiano', () => {
        const ref = keys(DICTIONARIES.it).sort();
        for (const dict of Object.values(DICTIONARIES)) expect(keys(dict).sort()).toEqual(ref);
    });

    it('nessuna traduzione vuota', () => {
        for (const [lang, dict] of Object.entries(DICTIONARIES)) {
            for (const k of keys(dict)) {
                const v = k.split('.').reduce<unknown>((n, p) => (n as Record<string, unknown>)[p], dict);
                expect(v, `${lang}:${k}`).not.toBe('');
            }
        }
    });

    it('interpolazione dei parametri', () => {
        expect(translate('it', 'auth.welcome', { name: 'Ada' })).toBe('Bentornato, Ada');
        expect(translate('en', 'system.soonTitle', { module: 'Invoices' })).toBe('Invoices — in development');
    });
});
