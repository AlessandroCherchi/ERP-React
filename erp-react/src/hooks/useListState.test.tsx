// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useListState } from './useListState';

function setup(initial = '/') {
    const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={[initial]}>{children}</MemoryRouter>;
    return renderHook(() => ({
        list: useListState<'nome' | 'id', { stato: 'all' | 'attivo' }>({ sort: { key: 'id', dir: 'asc' }, filters: { stato: 'all' } }),
        location: useLocation(),
    }), { wrapper });
}

describe('useListState', () => {
    it('legge lo stato dalla query string (link condivisibili)', () => {
        const { result } = setup('/?q=rossi&stato=attivo&sort=nome&dir=desc&page=2');
        expect(result.current.list.search).toBe('rossi');
        expect(result.current.list.filters.stato).toBe('attivo');
        expect(result.current.list.sortKey).toBe('nome');
        expect(result.current.list.sortDir).toBe('desc');
        expect(result.current.list.page).toBe(2);
    });

    it('un filtro al valore di default non sporca l’URL', () => {
        const { result } = setup('/?stato=attivo');
        act(() => result.current.list.setFilter('stato', 'all'));
        expect(result.current.location.search).toBe('');
    });

    it('cambiare ricerca o filtro riporta a pagina 1', () => {
        const { result } = setup('/?page=3');
        act(() => result.current.list.setSearch('x'));
        expect(result.current.list.page).toBe(1);
        expect(result.current.location.search).toBe('?q=x');
    });

    it('toggleSort: stessa colonna inverte, colonna nuova parte da asc', () => {
        const { result } = setup('/');
        act(() => result.current.list.toggleSort('nome'));
        expect([result.current.list.sortKey, result.current.list.sortDir]).toEqual(['nome', 'asc']);
        act(() => result.current.list.toggleSort('nome'));
        expect(result.current.list.sortDir).toBe('desc');
    });
});
