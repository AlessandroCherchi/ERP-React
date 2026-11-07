import { useEffect, useState, type CSSProperties } from 'react';

/**
 * Entrance animation a cascata — porting 1:1 di staggerEntrance() in
 * dashboard.js/clienti.js (doppio requestAnimationFrame per garantire
 * che lo stato iniziale opacity:0 sia dipinto prima della transizione).
 */
export function useStagger() {
    const [entered, setEntered] = useState(false);

    useEffect(() => {
        const raf1 = requestAnimationFrame(() => {
            const raf2 = requestAnimationFrame(() => setEntered(true));
            return () => cancelAnimationFrame(raf2);
        });
        return () => cancelAnimationFrame(raf1);
    }, []);

    return function staggerStyle(index: number): CSSProperties {
        const delay = index * 80;
        return {
            opacity: entered ? 1 : 0,
            transform: entered ? 'translateY(0)' : 'translateY(24px)',
            transition: `opacity .5s ease ${delay}ms, transform .5s cubic-bezier(.22,1,.36,1) ${delay}ms`,
        };
    };
}
