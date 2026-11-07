import { useEffect, useRef } from 'react';
import { readToken } from '../../config/theme';
import { currentLocale } from '../../lib/format';

interface RevenueChartProps {
    labels: string[];
    data: number[];
    /** Etichetta dei valori sull'asse Y (default: notazione compatta del locale). */
    formatY?: (value: number) => string;
    /** Descrizione per le tecnologie assistive (il canvas non è leggibile). */
    ariaLabel?: string;
}

const compact = (v: number) => new Intl.NumberFormat(currentLocale(), { notation: 'compact', maximumFractionDigits: 1 }).format(v);

/** Grafico ad area — porting 1:1 di drawRevenueChart() in dashboard.js (canvas puro, no dipendenze). */
export function RevenueChart({ labels, data, formatY = compact, ariaLabel }: RevenueChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        function draw() {
            const c = canvas!;
            const ctx = c.getContext('2d');
            const container = c.parentElement;
            if (!ctx || !container) return;

            c.width = container.offsetWidth;
            c.height = container.offsetHeight;

            const w = c.width;
            const h = c.height;
            const padL = 50;
            const padR = 20;
            const padT = 20;
            const padB = 40;

            // max ≥ 1: con serie tutta a zero (nessun dato) la scala resta definita
            const maxVal = Math.max(1, ...data) * 1.15;
            const chartW = w - padL - padR;
            const chartH = h - padT - padB;
            const stepX = chartW / Math.max(1, data.length - 1);

            ctx.clearRect(0, 0, w, h);

            ctx.strokeStyle = `rgba(${readToken('--erp-shadow-dark-rgb', '195, 195, 195')}, .25)`;
            ctx.lineWidth = 1;
            for (let g = 0; g < 5; g++) {
                const gy = padT + (chartH / 4) * g;
                ctx.beginPath();
                ctx.moveTo(padL, gy);
                ctx.lineTo(w - padR, gy);
                ctx.stroke();

                ctx.fillStyle = readToken('--erp-text-muted', '#9a9a9a');
                ctx.font = `500 10px ${readToken('--erp-font', 'sans-serif')}`;
                ctx.textAlign = 'right';
                const yLabel = Math.round(maxVal - (maxVal / 4) * g);
                ctx.fillText(formatY(yLabel), padL - 8, gy + 4);
            }

            const gradient = ctx.createLinearGradient(0, padT, 0, h - padB);
            gradient.addColorStop(0, `rgba(${readToken('--erp-accent-rgb', '161, 15, 15')}, .18)`);
            gradient.addColorStop(1, `rgba(${readToken('--erp-accent-rgb', '161, 15, 15')}, .01)`);

            const points = data.map((v, i) => ({
                x: padL + stepX * i,
                y: padT + chartH - (v / maxVal) * chartH,
            }));

            ctx.beginPath();
            ctx.moveTo(points[0]!.x, h - padB);
            points.forEach((p, i) => {
                if (i === 0) {
                    ctx.lineTo(p.x, p.y);
                    return;
                }
                const prev = points[i - 1]!;
                const cp1x = prev.x + stepX * 0.4;
                const cp2x = p.x - stepX * 0.4;
                ctx.bezierCurveTo(cp1x, prev.y, cp2x, p.y, p.x, p.y);
            });
            ctx.lineTo(points[points.length - 1]!.x, h - padB);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.beginPath();
            points.forEach((p, i) => {
                if (i === 0) {
                    ctx.moveTo(p.x, p.y);
                    return;
                }
                const prev = points[i - 1]!;
                const cp1x = prev.x + stepX * 0.4;
                const cp2x = p.x - stepX * 0.4;
                ctx.bezierCurveTo(cp1x, prev.y, cp2x, p.y, p.x, p.y);
            });
            ctx.strokeStyle = readToken('--erp-accent', '#a10f0f');
            ctx.lineWidth = 2.5;
            ctx.stroke();

            points.forEach((p) => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                ctx.fillStyle = readToken('--erp-bg', '#e8e8e8');
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = readToken('--erp-accent', '#a10f0f');
                ctx.stroke();
            });

            ctx.fillStyle = readToken('--erp-text-muted', '#9a9a9a');
            ctx.font = `500 10px ${readToken('--erp-font', 'sans-serif')}`;
            ctx.textAlign = 'center';
            labels.forEach((lbl, i) => {
                ctx.fillText(lbl, padL + stepX * i, h - padB + 18);
            });
        }

        draw();

        const container = canvas.parentElement;
        const observer = container ? new ResizeObserver(() => draw()) : null;
        if (container && observer) observer.observe(container);

        return () => observer?.disconnect();
    }, [labels, data, formatY]);

    return <canvas ref={canvasRef} role="img" aria-label={ariaLabel ?? labels.map((l, i) => `${l}: ${formatY(data[i] ?? 0)}`).join(", ")} />;
}
