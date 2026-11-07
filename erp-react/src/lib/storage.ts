// Accesso a localStorage che non lancia mai.
// Lo storage del browser può essere assente (SSR/test), pieno (quota) o
// bloccato (modalità privata, policy aziendali): in tutti questi casi
// l'app deve continuare a funzionare, solo senza persistenza (spec §9).

function store(): Storage | null {
    try {
        return typeof window !== 'undefined' ? window.localStorage : null;
    } catch {
        return null;
    }
}

export const safeStorage = {
    get(key: string): string | null {
        try {
            return store()?.getItem(key) ?? null;
        } catch {
            return null;
        }
    },
    set(key: string, value: string): boolean {
        try {
            store()?.setItem(key, value);
            return true;
        } catch {
            return false;
        }
    },
    remove(key: string): void {
        try {
            store()?.removeItem(key);
        } catch {
            /* storage non disponibile: nulla da rimuovere */
        }
    },
    /** Chiavi che iniziano con `prefix`. */
    keys(prefix: string): string[] {
        try {
            const s = store();
            if (!s) return [];
            const out: string[] = [];
            for (let i = 0; i < s.length; i++) {
                const k = s.key(i);
                if (k && k.startsWith(prefix)) out.push(k);
            }
            return out;
        } catch {
            return [];
        }
    },
};
