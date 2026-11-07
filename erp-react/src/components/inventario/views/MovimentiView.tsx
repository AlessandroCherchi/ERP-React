import { useMemo } from 'react';
import { DataTable, ListToolbar, ToolbarSelect, type Column } from '../../data';
import { useListState } from '../../../hooks/useListState';
import { useMagazzini, useMovimenti, useProdotti } from '../../../data';
import { useConfig } from '../../../config/configStore';
import { formatDate, formatNumber } from '../../../lib/format';
import { exportCsv } from '../../../lib/csv';
import { queryRows } from '../../../lib/listQuery';
import { MOVIMENTO_LABEL, type Movimento, type MovimentoTipo } from '../../../types/prodotto';

type TipoFilter = 'all' | MovimentoTipo;

const TIPI: { value: TipoFilter; label: string }[] = [
    { value: 'all', label: 'Tutti' },
    { value: 'carico', label: 'Carichi' },
    { value: 'scarico', label: 'Scarichi' },
    { value: 'rettifica', label: 'Rettifiche' },
    { value: 'trasferimento', label: 'Trasferimenti' },
];

/** Registro movimenti completo: la storia di ogni variazione di giacenza. */
export function MovimentiView() {
    const { pageSize, features } = useConfig();
    const { data: movimenti = [] } = useMovimenti();
    const { data: prodotti = [] } = useProdotti();
    const { data: magazzini = [] } = useMagazzini();
    const list = useListState<'data', { tipo: TipoFilter; mag: string }>({ sort: { key: 'data', dir: 'desc' }, filters: { tipo: 'all', mag: 'all' } });

    const articolo = useMemo(() => {
        const m = new Map(prodotti.map((p) => [p.id, p]));
        return (id: number) => m.get(id);
    }, [prodotti]);
    const nomeMag = useMemo(() => {
        const m = new Map(magazzini.map((x) => [x.id, x.codice]));
        return (id?: number) => (id == null ? '' : m.get(id) ?? `#${id}`);
    }, [magazzini]);

    const { tipo, mag } = list.filters;
    const result = useMemo(() => queryRows(movimenti, {
        filters: [
            ...(tipo === 'all' ? [] : [(m: Movimento) => m.tipo === tipo]),
            ...(mag === 'all' ? [] : [(m: Movimento) => m.magazzinoId === Number(mag) || m.magazzinoDestId === Number(mag)]),
        ],
        search: list.search,
        searchFields: (m) => [articolo(m.prodottoId)?.sku ?? '', articolo(m.prodottoId)?.nome ?? '', m.causale, m.note],
        // a parità di data, il più recente (id maggiore) prima
        sort: { key: 'data', dir: list.sortDir, value: (m) => `${m.data}-${String(m.id).padStart(8, '0')}` },
        page: { current: list.page, size: pageSize },
    }), [movimenti, tipo, mag, list.search, list.sortDir, list.page, pageSize, articolo]);

    const columns: Column<Movimento, 'data'>[] = [
        { id: 'data', header: 'Data', sortKey: 'data', cell: (m) => formatDate(m.data) },
        { id: 'art', header: 'Articolo', cell: (m) => <><strong>{articolo(m.prodottoId)?.sku ?? '—'}</strong> {articolo(m.prodottoId)?.nome ?? 'articolo eliminato'}</> },
        { id: 'tipo', header: 'Tipo', cell: (m) => <span className={`movement-qty movement-qty--${m.tipo}`}>{MOVIMENTO_LABEL[m.tipo]}</span> },
        ...(features.multiMagazzino ? [{ id: 'mag', header: 'Magazzino', cell: (m: Movimento) => (m.magazzinoDestId ? `${nomeMag(m.magazzinoId)} → ${nomeMag(m.magazzinoDestId)}` : nomeMag(m.magazzinoId)) }] : []),
        { id: 'q', header: 'Quantità', className: 'cell-strong', cell: (m) => `${m.tipo === 'scarico' ? '−' : m.tipo === 'carico' ? '+' : ''}${formatNumber(m.quantita)} ${articolo(m.prodottoId)?.unita ?? ''}` },
        { id: 'causale', header: 'Causale', cell: (m) => m.causale },
        { id: 'saldo', header: 'Giacenza dopo', cell: (m) => formatNumber(m.giacenzaFinale) },
    ];

    return (
        <>
            <ListToolbar
                search={list.search}
                onSearchChange={list.setSearch}
                searchPlaceholder="Cerca per SKU, articolo o causale..."
                chips={{ label: 'Filtra per tipo', value: tipo, options: TIPI, onChange: (v) => list.setFilter('tipo', v) }}
                onExport={() => exportCsv('movimenti', result.filtered, [
                    { header: 'Data', value: (m) => m.data },
                    { header: 'SKU', value: (m) => articolo(m.prodottoId)?.sku ?? '' },
                    { header: 'Articolo', value: (m) => articolo(m.prodottoId)?.nome ?? '' },
                    { header: 'Tipo', value: (m) => MOVIMENTO_LABEL[m.tipo] },
                    { header: 'Magazzino', value: (m) => nomeMag(m.magazzinoId) },
                    { header: 'Destinazione', value: (m) => nomeMag(m.magazzinoDestId) },
                    { header: 'Quantità', value: (m) => m.quantita },
                    { header: 'Causale', value: (m) => m.causale },
                    { header: 'Giacenza dopo', value: (m) => m.giacenzaFinale },
                    { header: 'Note', value: (m) => m.note },
                ])}
            >
                {features.multiMagazzino && magazzini.length > 1 && (
                    <ToolbarSelect label="Filtra per magazzino" value={mag} onChange={(v) => list.setFilter('mag', v)}
                        options={[{ value: 'all', label: 'Tutti i magazzini' }, ...magazzini.map((m) => ({ value: String(m.id), label: m.nome }))]} />
                )}
            </ListToolbar>
            <DataTable
                rows={result.rows}
                columns={columns}
                sortKey="data"
                sortDir={list.sortDir}
                onSort={list.toggleSort}
                rowLabel={(m) => `movimento ${m.id}`}
                empty={{ icon: 'fa-right-left', text: 'Nessun movimento.' }}
                pagination={{ total: result.filtered.length, page: result.page, totalPages: result.totalPages, pageSize, onPageChange: list.setPage }}
            />
        </>
    );
}
