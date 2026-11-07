import { createContext, useContext } from 'react';

/**
 * Id del campo del FormGroup corrente: InputBox/SelectBox/TextareaBox lo
 * usano come `id`, la <label> come `htmlFor`. Senza, i lettori di schermo
 * non associano etichetta e campo (WCAG 1.3.1 / 4.1.2).
 */
export const FieldIdContext = createContext<string | undefined>(undefined);

/** Id del campo corrente, se dentro un FormGroup. */
export function useFieldId(): string | undefined {
    return useContext(FieldIdContext);
}

