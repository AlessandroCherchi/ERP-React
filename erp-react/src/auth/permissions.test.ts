import { describe, expect, it } from 'vitest';
import { can, canTransition, PERMISSIONS, RESOURCES, ROLES, type Action, type Resource, type Role } from './permissions';

// Trascrizione della tabella §5 della spec v3.1. Ogni cella è un caso:
// se qualcuno modifica PERMISSIONS senza aggiornare la spec, il test fallisce.
type Cell = 'CRUD' | 'R' | 'none' | 'submit';
const SPEC: Record<Resource, Record<Role, Cell>> = {
    organizzazione: { owner: 'CRUD', admin: 'CRUD', accounting: 'R', warehouse: 'none', viewer: 'none' },
    anagrafiche: { owner: 'CRUD', admin: 'CRUD', accounting: 'CRUD', warehouse: 'R', viewer: 'R' },
    magazzino: { owner: 'CRUD', admin: 'R', accounting: 'CRUD', warehouse: 'CRUD', viewer: 'R' },
    ordini: { owner: 'CRUD', admin: 'CRUD', accounting: 'CRUD', warehouse: 'R', viewer: 'R' }, // warehouse: "Limitato", vedi sotto
    fatture: { owner: 'CRUD', admin: 'CRUD', accounting: 'CRUD', warehouse: 'R', viewer: 'R' },
    sdi: { owner: 'submit', admin: 'submit', accounting: 'submit', warehouse: 'none', viewer: 'none' },
    audit: { owner: 'R', admin: 'R', accounting: 'R', warehouse: 'none', viewer: 'none' },
    impostazioni: { owner: 'CRUD', admin: 'CRUD', accounting: 'none', warehouse: 'none', viewer: 'none' },
};

describe('permission matrix §5', () => {
    for (const resource of RESOURCES) {
        for (const role of ROLES) {
            const cell = SPEC[resource][role];
            it(`${role} su ${resource}: ${cell}`, () => {
                const read = cell !== 'none';
                expect(can(role, resource, 'read')).toBe(read);
                if (cell === 'CRUD') {
                    for (const a of ['create', 'update', 'delete'] as Action[]) expect(can(role, resource, a)).toBe(true);
                }
                if (cell === 'R' || cell === 'none' || cell === 'submit') {
                    expect(can(role, resource, 'create')).toBe(false);
                    expect(can(role, resource, 'delete')).toBe(false);
                    // eccezione documentata: warehouse aggiorna lo stato degli ordini
                    if (!(role === 'warehouse' && resource === 'ordini')) {
                        expect(can(role, resource, 'update')).toBe(false);
                    }
                }
                expect(can(role, resource, 'submit')).toBe(cell === 'submit');
            });
        }
    }

    it('nessun permesso senza ruolo', () => {
        expect(can(null, 'ordini', 'read')).toBe(false);
    });

    it('la tabella copre tutti i ruoli e tutte le risorse', () => {
        for (const role of ROLES) expect(Object.keys(PERMISSIONS[role]).sort()).toEqual([...RESOURCES].sort());
    });
});

describe('"Limitato": magazzino sugli ordini', () => {
    it('avanza preparazione/spedizione/consegna', () => {
        expect(canTransition('warehouse', 'in-preparazione')).toBe(true);
        expect(canTransition('warehouse', 'spedito')).toBe(true);
        expect(canTransition('warehouse', 'consegnato')).toBe(true);
    });

    it('non conferma né annulla (effetti commerciali)', () => {
        expect(canTransition('warehouse', 'confermato')).toBe(false);
        expect(canTransition('warehouse', 'annullato')).toBe(false);
    });

    it('viewer non avanza nulla, accounting tutto', () => {
        expect(canTransition('viewer', 'spedito')).toBe(false);
        expect(canTransition('accounting', 'annullato')).toBe(true);
    });
});
