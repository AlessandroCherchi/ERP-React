import { useMemo } from 'react';
import { useAcquisti, useFatture, useIncassi, useOrdini, useProdotti } from '../data';
import { useVisibleModules } from '../app/useModules';
import { calcolaNotifiche, type Notifica } from '../lib/notifiche';
import { today } from '../lib/format';

/** Notifiche dei soli moduli visibili all'utente (tenant + ruolo). */
export function useNotifiche(): Notifica[] {
    const visibili = useVisibleModules();
    const { data: prodotti = [] } = useProdotti();
    const { data: ordini = [] } = useOrdini();
    const { data: fatture = [] } = useFatture();
    const { data: incassi = [] } = useIncassi();
    const { data: acquisti = [] } = useAcquisti();

    return useMemo(() => {
        const ammessi = new Set(visibili.map((m) => m.id));
        return calcolaNotifiche({ prodotti, ordini, fatture, incassi, acquisti, oggi: today() }).filter((n) => ammessi.has(n.modulo));
    }, [visibili, prodotti, ordini, fatture, incassi, acquisti]);
}
