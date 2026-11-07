import { useCallback, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import { useDismiss } from '../../hooks/useDismiss';
import { useT } from '../../i18n';

/**
 * Ricerca globale in topbar (combobox ARIA): frecce per muoversi fra i
 * risultati, Invio per aprire, Esc per chiudere.
 */
export function GlobalSearch() {
    const t = useT();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const hits = useGlobalSearch(query);
    const close = useCallback(() => setOpen(false), []);
    useDismiss(ref, open, close);

    function go(link: string) {
        navigate(link);
        setQuery('');
        setOpen(false);
    }

    function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (!hits.length) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % hits.length); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + hits.length) % hits.length); }
        else if (e.key === 'Enter') { e.preventDefault(); go(hits[active]!.link); }
    }

    const showList = open && query.trim().length >= 2;

    return (
        <div className="search-box popover-anchor" ref={ref}>
            <i className="fa-solid fa-magnifying-glass" />
            <input
                type="search"
                role="combobox"
                aria-expanded={showList}
                aria-controls="global-search-results"
                aria-activedescendant={showList && hits[active] ? `gs-${hits[active]!.id}` : undefined}
                aria-label={t('common.search')}
                placeholder={t('topbar.searchPlaceholder')}
                autoComplete="off"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
                onFocus={() => setOpen(true)}
                onKeyDown={onKeyDown}
            />
            {showList && (
                <ul className="popover popover--search" id="global-search-results" role="listbox">
                    {hits.length === 0 ? (
                        <li className="popover-empty">{t('topbar.noResults')}</li>
                    ) : hits.map((h, i) => (
                        <li key={h.id} id={`gs-${h.id}`} role="option" aria-selected={i === active}>
                            <button type="button" className={`popover-item${i === active ? ' active' : ''}`} onMouseEnter={() => setActive(i)} onClick={() => go(h.link)}>
                                <i className={`fa-solid ${h.icon}`} aria-hidden="true" />
                                <span className="popover-text"><strong>{h.titolo}</strong><small>{h.sottotitolo}</small></span>
                                <em className="popover-tag">{t(`nav.${h.modulo}`)}</em>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
