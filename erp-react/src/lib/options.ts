/** Errori standard di una lista: valori vuoti o duplicati, lista vuota. */
export function validateOptions<R extends { value: string | number; label: string }>(
    rows: R[],
    msg: { empty: string; duplicate: string }
): Record<number, string> {
    const errors: Record<number, string> = {};
    const seen = new Map<string, number>();
    rows.forEach((r, i) => {
        const key = String(r.value).trim();
        if (key === '' || !r.label.trim()) errors[i] = msg.empty;
        else if (seen.has(key)) errors[i] = msg.duplicate;
        seen.set(key, i);
    });
    return errors;
}
