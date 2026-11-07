import { useState } from 'react';

/**
 * Bozza locale di una sezione: si modifica liberamente e si applica solo al
 * salvataggio. Se la sorgente cambia (salvataggio, reset, cambio tenant) la
 * bozza si riallinea — durante il render, non in un effect, per non
 * dipingere un frame con la bozza vecchia (pattern "adjusting state on prop change").
 */
export function useDraft<T>(source: T) {
    const [draft, setDraft] = useState<T>(source);
    const [prevSource, setPrevSource] = useState<T>(source);
    if (prevSource !== source) {
        setPrevSource(source);
        setDraft(source);
    }
    const dirty = JSON.stringify(draft) !== JSON.stringify(source);
    return { draft, setDraft, dirty, discard: () => setDraft(source) };
}
