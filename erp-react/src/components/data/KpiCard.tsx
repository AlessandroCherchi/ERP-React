import type { CSSProperties } from 'react';
import { KpiValue } from '../ui/KpiValue';

export type KpiVariant = 'revenue' | 'clients' | 'active' | 'new' | 'orders' | 'stock' | 'warning' | 'danger';

export interface KpiCardProps {
    icon: string;
    variant: KpiVariant;
    label: string;
    /** Valore già formattato (animato in count-up). */
    value: string;
    trend?: { dir: 'up' | 'down'; text: string };
    style?: CSSProperties;
}

/** Card KPI della griglia in testa alle pagine. */
export function KpiCard({ icon, variant, label, value, trend, style }: KpiCardProps) {
    return (
        <div className="kpi-card" style={style}>
            <div className={`kpi-icon kpi-icon--${variant}`}><i className={`fa-solid ${icon}`} /></div>
            <div className="kpi-info">
                <span className="kpi-label">{label}</span>
                <KpiValue value={value} />
                {trend && (
                    <span className={`kpi-trend kpi-trend--${trend.dir}`}>
                        <i className={`fa-solid ${trend.dir === 'up' ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`} /> {trend.text}
                    </span>
                )}
            </div>
        </div>
    );
}

/** Griglia di KPI con ingresso a cascata. */
export function KpiGrid({ items, stagger }: { items: KpiCardProps[]; stagger: (i: number) => CSSProperties }) {
    return (
        <section className="kpi-grid">
            {items.map((k, i) => <KpiCard key={k.label} {...k} style={stagger(i)} />)}
        </section>
    );
}
