import { useEffect, useRef, useState } from 'react';

interface KpiValueProps {
    /** Testo finale già formattato, es. "€ 124.850" o "38". Porting di animateCounters/countUp. */
    value: string;
}

function parseTarget(value: string): { prefix: string; target: number } {
    const prefix = value.replace(/[\d.,]+/g, '').trim();
    const numStr = value.replace(/[^\d.,]/g, '').replace(/\./g, '');
    return { prefix, target: parseInt(numStr, 10) || 0 };
}

/**
 * Numero animato in count-up — porting di animateCounters/countUp in
 * dashboard.js. L'ingresso in viewport (IntersectionObserver) innesca
 * la prima animazione da 0; eventuali aggiornamenti successivi del
 * valore (es. dati arrivati da query async) riprendono da dove
 * l'ultimo count-up si era fermato, invece di restare bloccati su 0
 * come nell'originale (lì i dati erano sempre sincroni al render).
 */
export function KpiValue({ value }: KpiValueProps) {
    const [display, setDisplay] = useState(value);
    const ref = useRef<HTMLSpanElement>(null);
    const enteredRef = useRef(false);
    const currentRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const { prefix, target } = parseTarget(value);

        function animateFrom(start: number) {
            if (timerRef.current) clearInterval(timerRef.current);
            const duration = 1200;
            const steps = 50;
            const increment = (target - start) / steps;
            let current = start;
            let step = 0;

            timerRef.current = setInterval(() => {
                step++;
                current += increment;
                if (step >= steps) {
                    current = target;
                    if (timerRef.current) clearInterval(timerRef.current);
                }
                currentRef.current = current;
                const formatted = Math.round(current).toLocaleString('it-IT');
                setDisplay(prefix ? `${prefix} ${formatted}` : formatted);
            }, duration / steps);
        }

        if (enteredRef.current) {
            // valore aggiornato dopo il primo ingresso in viewport: riparte da dove era.
            animateFrom(currentRef.current);
            return () => { if (timerRef.current) clearInterval(timerRef.current); };
        }

        // Il count-up non è ancora partito. Finché non parte, il numero
        // mostrato deve comunque essere quello reale: l'IntersectionObserver
        // non emette callback se la pagina è nascosta (tab in background al
        // caricamento), e in quel caso il KPI resterebbe fermo sul valore del
        // primo render — cioè 0 mentre i dati dicono 24. Un KPI che non si
        // anima è accettabile; un KPI che mostra un numero falso no.
        setDisplay(value);

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !enteredRef.current) {
                        enteredRef.current = true;
                        animateFrom(0);
                    }
                });
            },
            { threshold: 0.3 }
        );
        observer.observe(el);

        return () => {
            observer.disconnect();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [value]);

    return (
        <span className="kpi-value" ref={ref}>
            {display}
        </span>
    );
}
