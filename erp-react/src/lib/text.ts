/** Iniziali (max 2) di un nome o ragione sociale, per gli avatar. */
export function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter((w) => /[\p{L}\p{N}]/u.test(w))
        .slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase())
        .join('');
}

/** Prima lettera maiuscola. */
export function capitalize(s: string): string {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}
