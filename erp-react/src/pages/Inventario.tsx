import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Topbar } from '../components/layout/Topbar';
import { ArticoliView } from '../components/inventario/views/ArticoliView';
import { MovimentiView } from '../components/inventario/views/MovimentiView';
import { ConteView } from '../components/inventario/views/ConteView';
import { MagazziniView } from '../components/inventario/views/MagazziniView';
import { useConfig } from '../config/configStore';
import '../styles/app-shell.css';
import '../styles/inventario.css';
import '../styles/documenti.css';
import '../styles/contabilita.css';

type Vista = 'articoli' | 'movimenti' | 'inventari' | 'magazzini';

/**
 * Inventario: catalogo e giacenze, registro movimenti, inventari fisici e
 * (con multi-magazzino) anagrafica magazzini. Vista attiva nell'URL.
 */
export function Inventario() {
    const { features } = useConfig();
    const [params, setParams] = useSearchParams();
    const viste: Array<[Vista, string, string]> = [
        ['articoli', 'Articoli', 'fa-boxes-stacked'],
        ['movimenti', 'Movimenti', 'fa-right-left'],
        ['inventari', 'Inventario fisico', 'fa-clipboard-list'],
        ...(features.multiMagazzino ? [['magazzini', 'Magazzini', 'fa-warehouse'] as [Vista, string, string]] : []),
    ];
    const vista = viste.find(([id]) => id === params.get('vista'))?.[0] ?? 'articoli';

    return (
        <AppLayout pageClass="inventario-page">
            <Topbar>
                <h1>Gestione Inventario</h1>
                <p>Catalogo, giacenze per magazzino, movimenti e inventari fisici</p>
            </Topbar>

            <div className="filter-group page-tabs" role="tablist" aria-label="Viste inventario">
                {viste.map(([id, label, icon]) => (
                    <button key={id} type="button" role="tab" aria-selected={vista === id} className={`chip-btn${vista === id ? ' active' : ''}`}
                        onClick={() => setParams(id === 'articoli' ? {} : { vista: id }, { replace: true })}>
                        <i className={`fa-solid ${icon}`} /> {label}
                    </button>
                ))}
            </div>

            {vista === 'articoli' && <ArticoliView />}
            {vista === 'movimenti' && <MovimentiView />}
            {vista === 'inventari' && <ConteView />}
            {vista === 'magazzini' && <MagazziniView />}
        </AppLayout>
    );
}
