import { describe, expect, it } from 'vitest';
import { capitalize, initials } from './text';

describe('text', () => {
    it('iniziali: max due, ignora simboli', () => {
        expect(initials('Bianchi & Co.')).toBe('BC');
        expect(initials('rossi s.r.l.')).toBe('RS');
        expect(initials('Indaco')).toBe('I');
    });

    it('capitalize', () => {
        expect(capitalize('attivo')).toBe('Attivo');
        expect(capitalize('')).toBe('');
    });
});
