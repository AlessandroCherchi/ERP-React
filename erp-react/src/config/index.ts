export * from './types';
export { DEFAULT_CONFIG } from './defaults';
export { useConfig, getConfig, useConfigStore, isModuleEnabled } from './configStore';
export { formatNumber, nextNumber } from './numbering';
export { applyTheme, hexToRgbTriplet, resolveThemeVars, type ThemeTokens } from './theme';

import type { Option } from './types';

/**
 * Opzioni di una select di tabella configurabile, garantendo la presenza del
 * valore corrente: un record creato prima di una modifica alla tabella
 * (o importato) deve continuare a mostrarlo, altrimenti la select lo
 * azzererebbe in silenzio al primo salvataggio.
 */
export function optionsWithCurrent<V extends string | number>(options: Option<V>[], current: V | '' | undefined): Option<V>[] {
    if (current === '' || current === undefined || options.some((o) => String(o.value) === String(current))) return options;
    return [{ value: current as V, label: String(current) }, ...options];
}
