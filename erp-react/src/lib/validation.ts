// Domain validation layer — Implementation Contract v3.1 §3
// "Input/output unknown validati prima del dominio" tramite Valibot.
// Sostituisce ERPUI.readFields/validate (scan DOM data-field) con un
// hook React idiomatico basato su schema condivisi client/backend.

import { useCallback, useState } from 'react';
import * as v from 'valibot';

export type FieldErrors<T extends object> = Partial<Record<keyof T, string>>;

interface UseValidatedFormResult<T extends object> {
    values: T;
    errors: FieldErrors<T>;
    setField: <K extends keyof T>(key: K, value: T[K]) => void;
    /** Valida con lo schema; true se valido. Popola `errors` sui campi non validi. */
    validate: () => boolean;
    reset: (next?: T) => void;
}

/**
 * @param schema  schema Valibot (v.object({...}))
 * @param initial valori iniziali del form
 */
export function useValidatedForm<T extends object>(
    schema: v.GenericSchema<T>,
    initial: T
): UseValidatedFormResult<T> {
    const [values, setValues] = useState<T>(initial);
    const [errors, setErrors] = useState<FieldErrors<T>>({});

    const setField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
        setValues((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    }, []);

    const validate = useCallback((): boolean => {
        const result = v.safeParse(schema, values);
        if (result.success) {
            setErrors({});
            return true;
        }

        const next: FieldErrors<T> = {};
        for (const issue of result.issues) {
            const key = issue.path?.[0]?.key as keyof T | undefined;
            if (key && !next[key]) next[key] = issue.message;
        }
        setErrors(next);
        return false;
    }, [schema, values]);

    const reset = useCallback((next?: T) => {
        setValues(next ?? initial);
        setErrors({});
    }, [initial]);

    return { values, errors, setField, validate, reset };
}
