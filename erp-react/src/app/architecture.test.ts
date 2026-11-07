import { describe, expect, it } from 'vitest';

// Fitness function dell'architettura: le regole di dipendenza fra layer
// sono verificate a ogni build, non affidate alla disciplina.
const sources = import.meta.glob(['../**/*.{ts,tsx}', '!../**/*.test.{ts,tsx}'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const importsOf = (code: string) => [...code.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]!);

describe('architettura', () => {
    it('pagine e componenti non importano i mock: passano dal data layer (src/data)', () => {
        const violazioni = Object.entries(sources)
            .filter(([file]) => /\/(pages|components|hooks|app)\//.test(file))
            .flatMap(([file, code]) => importsOf(code).filter((i) => i.includes('mockApi')).map((i) => `${file} → ${i}`));
        expect(violazioni).toEqual([]);
    });

    it('il dominio (types/) non dipende da React né dalla UI', () => {
        const violazioni = Object.entries(sources)
            .filter(([file]) => file.includes('/types/'))
            .flatMap(([file, code]) => importsOf(code).filter((i) => i === 'react' || /components|pages|data\//.test(i)).map((i) => `${file} → ${i}`));
        expect(violazioni).toEqual([]);
    });

    it('nessun colore esadecimale nei componenti (solo token)', () => {
        const violazioni = Object.entries(sources)
            .filter(([file]) => file.endsWith('.tsx'))
            // ammessi: i fallback di readToken() e il valore neutro dell'<input type="color">
            .filter(([, code]) => code.split('\n').some((line) =>
                /['"`]#[0-9a-fA-F]{3,8}['"`]/.test(line) && !line.includes('readToken(') && !line.includes("'#000000'")))
            .map(([file]) => file);
        expect(violazioni).toEqual([]);
    });
});
