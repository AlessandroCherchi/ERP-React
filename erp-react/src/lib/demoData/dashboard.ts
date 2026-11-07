// Dati demo dashboard — porting 1:1 di dashboard.js (REVENUE_*, ACTIVITIES, PRODUCTS).
// TODO(step Backend, spec §4): sostituire con query reali su /api/v1/*.

export const REVENUE_LABELS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
export const REVENUE_DATA = [42, 58, 45, 72, 68, 85, 96, 78, 110, 95, 124, 118];

export interface Activity {
    id: number;
    icon: string;
    title: string;
    desc: string;
    time: string;
}

export const INITIAL_ACTIVITIES: Activity[] = [
    { id: 1, icon: 'fa-file-invoice-dollar', title: 'Fattura #1284 emessa', desc: 'Cliente: Rossi S.r.l.', time: '5 min fa' },
    { id: 2, icon: 'fa-cart-shopping', title: 'Nuovo ordine #3092', desc: '12 articoli — € 2.340', time: '18 min fa' },
    { id: 3, icon: 'fa-user-plus', title: 'Nuovo cliente registrato', desc: 'Mario Bianchi — Milano', time: '42 min fa' },
    { id: 4, icon: 'fa-boxes-stacked', title: 'Stock aggiornato', desc: 'SKU-4521: +200 unità', time: '1 ora fa' },
    { id: 5, icon: 'fa-truck-fast', title: 'Spedizione #890 partita', desc: 'Corriere: BRT Express', time: '2 ore fa' },
    { id: 6, icon: 'fa-circle-check', title: 'Ordine #3088 completato', desc: 'Pagamento confermato', time: '3 ore fa' },
];

export interface Product {
    rank: number;
    name: string;
    cat: string;
    sold: number;
    revenue: string;
    up: boolean;
    pct: string;
}

export const PRODUCTS: Product[] = [
    { rank: 1, name: 'Widget Pro X200', cat: 'Elettronica', sold: 342, revenue: '€ 18.430', up: true, pct: '+14%' },
    { rank: 2, name: 'Sensore IoT Mk3', cat: 'Componenti', sold: 289, revenue: '€ 12.750', up: true, pct: '+9%' },
    { rank: 3, name: 'Pannello LED Ultra', cat: 'Illuminazione', sold: 215, revenue: '€ 9.890', up: false, pct: '-3%' },
    { rank: 4, name: 'Cavo Cat.7 Premium', cat: 'Networking', sold: 198, revenue: '€ 4.356', up: true, pct: '+22%' },
    { rank: 5, name: 'Adattatore USB-C Hub', cat: 'Accessori', sold: 176, revenue: '€ 7.040', up: true, pct: '+6%' },
];

export const DONUT_SEGMENTS = [
    { value: 64, color: '#a10f0f' },
    { value: 24, color: '#b8860b' },
    { value: 12, color: '#c3c3c3' },
];
