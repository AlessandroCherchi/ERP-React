import { describe, expect, it } from 'vitest';

// Guardia del white-label: i colori vivono SOLO in tokens.css.
// Un hex o un rgb() letterale in un altro foglio è un colore che un
// tenant non potrà mai cambiare — il test lo blocca prima del merge.
const sheets = import.meta.glob('./*.css', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const LITERAL_COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d+\s*,/g;

describe('design token', () => {
    it('trova i fogli di stile', () => {
        expect(Object.keys(sheets).length).toBeGreaterThan(5);
    });

    for (const [file, css] of Object.entries(sheets)) {
        if (file.endsWith('tokens.css')) continue;
        it(`${file} non contiene colori letterali`, () => {
            const senzaCommenti = css.replace(/\/\*[\s\S]*?\*\//g, '');
            expect(senzaCommenti.match(LITERAL_COLOR) ?? []).toEqual([]);
        });
    }

    it('ogni var(--erp-*) usata è definita in tokens.css', () => {
        const tokens = sheets['./tokens.css']!;
        const defined = new Set([...tokens.matchAll(/(--erp-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
        const used = new Set(
            Object.values(sheets).flatMap((css) => [...css.matchAll(/var\((--erp-[a-z0-9-]+)/g)].map((m) => m[1]))
        );
        expect([...used].filter((t) => !defined.has(t))).toEqual([]);
    });
});
