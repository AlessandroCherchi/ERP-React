import { useEffect, useRef } from 'react';

interface RevenueChartProps {
    labels: string[];
    data: number[];
}

/** Grafico ad area — porting 1:1 di drawRevenueChart() in dashboard.js (canvas puro, no dipendenze). */
export function RevenueChart({ labels, data }: RevenueChartProps) {
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

            const maxVal = Math.max(...data) * 1.15;
            const chartW = w - padL - padR;
            const chartH = h - padT - padB;
            const stepX = chartW / (data.length - 1);

            ctx.clearRect(0, 0, w, h);

            ctx.strokeStyle = 'rgba(195,195,195,.25)';
            ctx.lineWidth = 1;
            for (let g = 0; g < 5; g++) {
                const gy = padT + (chartH / 4) * g;
                ctx.beginPath();
                ctx.moveTo(padL, gy);
                ctx.lineTo(w - padR, gy);
                ctx.stroke();

                ctx.fillStyle = '#9a9a9a';
                ctx.font = '500 10px Poppins';
                ctx.textAlign = 'right';
                const yLabel = Math.round(maxVal - (maxVal / 4) * g);
                ctx.fillText(yLabel + 'k', padL - 8, gy + 4);
            }

            const gradient = ctx.createLinearGradient(0, padT, 0, h - padB);
            gradient.addColorStop(0, 'rgba(161,15,15,.18)');
            gradient.addColorStop(1, 'rgba(161,15,15,.01)');

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
            ctx.strokeStyle = '#a10f0f';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            points.forEach((p) => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#e8e8e8';
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#a10f0f';
                ctx.stroke();
            });

            ctx.fillStyle = '#9a9a9a';
            ctx.font = '500 10px Poppins';
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
    }, [labels, data]);

    return <canvas ref={canvasRef} />;
}
