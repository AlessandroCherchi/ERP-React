// i18n minimale e tipizzato, senza dipendenze esterne.
// Le chiavi sono verificate a compile-time (TKey): una chiave mancante o
// scritta male non compila. La lingua arriva dal config del tenant.

import { useCallback } from 'react';
import { it } from './it';
import { en } from './en';
import type { Dictionary, TKey } from './types';
import { useConfigStore } from '../config/configStore';

export type Language = 'it' | 'en';
export type { TKey, Dictionary };

export const DICTIONARIES: Record<Language, Dictionary> = { it, en };

function lookup(dict: Dictionary, key: string): string | undefined {
    let node: unknown = dict;
    for (const part of key.split('.')) {
        if (typeof node !== 'object' || node === null) return undefined;
        node = (node as Record<string, unknown>)[part];
    }
    return typeof node === 'string' ? node : undefined;
}

/** Traduce una chiave con interpolazione {param}. Fallback: italiano, poi la chiave. */
export function translate(lang: Language, key: TKey, params?: Record<string, string | number>): string {
    const raw = lookup(DICTIONARIES[lang], key) ?? lookup(it, key) ?? key;
    if (!params) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, p: string) => (p in params ? String(params[p]) : `{${p}}`));
}

export type TFunction = (key: TKey, params?: Record<string, string | number>) => string;

/** Hook di traduzione per la lingua del tenant corrente. */
export function useT(): TFunction {
    const lang = useConfigStore((s) => s.config.locale.language);
    return useCallback((key, params) => translate(lang, key, params), [lang]);
}
