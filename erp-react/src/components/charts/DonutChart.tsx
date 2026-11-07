import { useEffect, useRef } from 'react';

interface Segment {
    value: number;
    color: string;
}

interface DonutChartProps {
    segments: Segment[];
}

/** Donut ordini-per-stato — porting 1:1 di drawDonutChart() in dashboard.js. */
export function DonutChart({ segments }: DonutChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        function draw() {
            const c = canvas!;
            const container = c.parentElement;
            if (!container) return;

            const size = Math.min(container.offsetWidth, container.offsetHeight);
            c.width = size;
            c.height = size;

            const ctx = c.getContext('2d');
            if (!ctx) return;

            const cx = size / 2;
            const cy = size / 2;
            const outerR = size / 2 - 10;
            const innerR = outerR * 0.6;

            ctx.clearRect(0, 0, size, size);

            const total = segments.reduce((s, seg) => s + seg.value, 0);
            let startAngle = -Math.PI / 2;

            segments.forEach((seg) => {
                const sliceAngle = (seg.value / total) * Math.PI * 2;
                ctx.beginPath();
                ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
                ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
                ctx.closePath();
                ctx.fillStyle = seg.color;
                ctx.fill();

                ctx.shadowColor = 'rgba(0,0,0,.08)';
                ctx.shadowBlur = 6;
                ctx.fill();
                ctx.shadowColor = 'transparent';

                startAngle += sliceAngle;
            });

            ctx.fillStyle = '#4a4a4a';
            ctx.font = '800 28px Poppins';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(total), cx, cy - 6);
            ctx.font = '500 10px Poppins';
            ctx.fillStyle = '#9a9a9a';
            ctx.fillText('Totale', cx, cy + 14);
        }

        draw();

        const container = canvas.parentElement;
        const observer = container ? new ResizeObserver(() => draw()) : null;
        if (container && observer) observer.observe(container);

        return () => observer?.disconnect();
    }, [segments]);

    return <canvas ref={canvasRef} />;
}
