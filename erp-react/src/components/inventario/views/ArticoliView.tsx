import { useMemo, useState } from 'react';
import { DataTable, EntityCell, KpiGrid, ListToolbar, ToolbarSelect, type Column, type RowAction } from '../../data';
import { ProductDetailPanel } from '../ProductDetailPanel';
import { ProdottoModal } from '../ProdottoModal';
import { MovimentoModal } from '../MovimentoModal';
import { StockBar } from '../StockBar';
import { TrasferimentoModal } from '../TrasferimentoModal';
import type { PanelAction } from '../../ui/DetailPanelShell';
import { useToast } from '../../ui/toastContext';
import { useStagger } from '../../../hooks/useStagger';
import { useListState } from '../../../hooks/useListState';
import { useCrudDialogs } from '../../../hooks/useCrudDialogs';
import { useDeleteConfirm } from '../../../hooks/useDeleteConfirm';
import {
    useCreateProdotto, useDeleteProdotto, useFornitoriRef, useMagazzini, useMovimenti, useProdotti,
    useRegistraMovimento, useTrasferisci, useUpdateProdotto,
} from '../../../data';
import { usePermissions } from '../../../auth/hooks';
import { useConfig } from '../../../config/configStore';
import { nextNumber } from '../../../config/numbering';
import { formatEuro, formatNumber, parseNum } from '../../../lib/format';
import { exportCsv } from '../../../lib/csv';
import { queryRows } from '../../../lib/listQuery';
import {
    statoProdotto, STATO_LABEL, valoreGiacenza,
    type MovimentoFormValues, type Prodotto, type ProdottoStato,
} from '../../../types/prodotto';
import type { ProdottoForm } from '../../../types/prodotto';
import { giacenzaIn } from '../../../types/magazzino';

type SortKey = 'sku' | 'nome' | 'categoria' | 'giacenza' | 'prezzo' | 'valore';
type StatoFilter = 'all' | ProdottoStato;

const STATO_CHIPS: { value: StatoFilter; label: string }[] = [
    { value: 'all', label: 'Tutti' },
    { value: 'disponibile', label: 'Disponibili' },
    { value: 'sotto-scorta', label: 'Sotto scorta' },
    { value: 'esaurito', label: 'Esauriti' },
];

/** Valore ordinabile: "valore" è derivato (giacenza × costo), il resto è un campo. */
function sortValue(p: Prodotto, key: SortKey): string | number {
    return key === 'valore' ? valoreGiacenza(p) : p[key];
}

/** Vista Articoli: catalogo, giacenze, movimenti manuali, trasferimenti. */
export function ArticoliView() {
    const { toast } = useToast();
    const stagger = useStagger();
    const confirmDelete = useDeleteConfirm();
    const perm = usePermissions('magazzino');
    const config = useConfig();
    const { pageSize, tables } = config;

    const { data: prodotti = [] } = useProdotti();
    const { data: movimenti = [] } = useMovimenti();
    const { data: fornitori = [] } = useFornitoriRef();
    const { data: tuttiMagazzini = [] } = useMagazzini();
    // Con multi-magazzino disattivato si lavora solo sul principale.
    const magazzini = useMemo(() => {
        const attivi = tuttiMagazzini.filter((m) => m.attivo);
        return config.features.multiMagazzino ? attivi : attivi.filter((m) => m.principale);
    }, [tuttiMagazzini, config.features.multiMagazzino]);
    const principale = magazzini.find((m) => m.principale)?.id ?? 1;
    const multi = magazzini.length > 1;

    const list = useListState<SortKey, { stato: StatoFilter; categoria: string; mag: string }>({
        sort: { key: 'sku', dir: 'asc' },
        filters: { stato: 'all', categoria: 'all', mag: 'all' },
    });
    const dlg = useCrudDialogs(prodotti);
    const [movimentoId, setMovimentoId] = useState<number | null>(null);
    const [trasferimentoId, setTrasferimentoId] = useState<number | null>(null);

    const nomeFornitore = useMemo(() => {
        const map = new Map(fornitori.map((f) => [f.id, f.nome]));
        return (p: Prodotto) => (p.fornitoreId != null ? map.get(p.fornitoreId) ?? '' : '');
    }, [fornitori]);
    const iconaCategoria = useMemo(() => {
        const map = new Map(tables.categorie.map((c) => [c.value, c.icon]));
        return (categoria: string) => map.get(categoria) ?? 'fa-box';
    }, [tables.categorie]);

    // Le mutation di magazzino invalidano da sé giacenze e movimenti (data/hooks.ts).
    const createMut = useCreateProdotto({ onSuccess: (p) => toast(`Prodotto "${p.nome}" creato con successo.`, 'success') });
    const updateMut = useUpdateProdotto({ onSuccess: (p) => toast(`Prodotto "${p.nome}" aggiornato con successo.`, 'success') });
    const deleteMut = useDeleteProdotto({ onSuccess: () => toast('Prodotto eliminato.', 'info') });
    const trasferimentoMut = useTrasferisci({
        onSuccess: (p) => toast(`Trasferimento di "${p.nome}" registrato.`, 'success'),
        onError: (e) => toast(e.message, 'error'),
    });
    const movimentoMut = useRegistraMovimento({
        onSuccess: (p) => toast(`Giacenza di "${p.nome}" aggiornata: ${formatNumber(p.giacenza)} ${p.unita}.`, 'success'),
    });

    const { stato, categoria, mag } = list.filters;
    const result = useMemo(() => queryRows(prodotti, {
        filters: [
            ...(stato === 'all' ? [] : [(p: Prodotto) => statoProdotto(p) === stato]),
            ...(categoria === 'all' ? [] : [(p: Prodotto) => p.categoria === categoria]),
            ...(mag === 'all' ? [] : [(p: Prodotto) => giacenzaIn(p.giacenze, Number(mag)) > 0]),
        ],
        search: list.search,
        searchFields: (p) => [p.nome, p.sku, nomeFornitore(p), p.categoria, p.ubicazione],
        sort: { key: list.sortKey, dir: list.sortDir, value: sortValue },
        page: { current: list.page, size: pageSize },
    }), [prodotti, stato, categoria, mag, list.search, list.sortKey, list.sortDir, list.page, pageSize, nomeFornitore]);

    function handleDelete(p: Prodotto) {
        confirmDelete(`"${p.nome}" (${p.sku})`, () => deleteMut.mutate(p.id), 'Viene rimosso anche lo storico movimenti.');
    }

    function handleSubmit(values: ProdottoForm) {
        if (dlg.editingId != null) updateMut.mutate({ id: dlg.editingId, data: values });
        else createMut.mutate(values);
        dlg.closeModal();
    }

    function handleMovimento(values: MovimentoFormValues) {
        if (movimentoId == null) return;
        movimentoMut.mutate({
            prodottoId: movimentoId,
            tipo: values.tipo,
            magazzinoId: Number(values.magazzinoId) || principale,
            quantita: parseNum(values.quantita),
            causale: values.causale,
            data: values.data,
            note: values.note,
        });
        setMovimentoId(null);
    }

    function handleExport() {
        exportCsv('inventario', result.filtered, [
            { header: 'SKU', value: (p) => p.sku },
            { header: 'Prodotto', value: (p) => p.nome },
            { header: 'Categoria', value: (p) => p.categoria },
            { header: 'Fornitore', value: nomeFornitore },
            { header: 'Giacenza', value: (p) => p.giacenza },
            { header: 'Unità', value: (p) => p.unita },
            { header: 'Scorta minima', value: (p) => p.scorta },
            { header: 'Costo', value: (p) => p.costo },
            { header: 'Prezzo', value: (p) => p.prezzo },
            { header: 'Valore magazzino', value: valoreGiacenza },
            { header: 'IVA %', value: (p) => p.iva },
            { header: 'Ubicazione', value: (p) => p.ubicazione },
            { header: 'Stato', value: (p) => STATO_LABEL[statoProdotto(p)] },
        ]);
        toast('Export CSV completato.', 'success');
    }

    const columns: Column<Prodotto, SortKey>[] = [
        { id: 'sku', header: 'SKU', sortKey: 'sku', className: 'cell-sku', cell: (p) => p.sku },
        {
            id: 'nome', header: 'Prodotto', sortKey: 'nome',
            cell: (p) => <EntityCell icon={<i className={`fa-solid ${iconaCategoria(p.categoria)}`} />} label={p.nome} onOpen={() => dlg.openDetail(p.id)} />,
        },
        { id: 'categoria', header: 'Categoria', sortKey: 'categoria', cell: (p) => p.categoria },
        { id: 'fornitore', header: 'Fornitore', cell: (p) => nomeFornitore(p) || '—' },
        { id: 'giacenza', header: 'Giacenza', sortKey: 'giacenza', cell: (p) => <StockBar giacenza={p.giacenza} scorta={p.scorta} unita={p.unita} /> },
        { id: 'prezzo', header: 'Prezzo', sortKey: 'prezzo', className: 'cell-strong', cell: (p) => formatEuro(p.prezzo) },
        { id: 'valore', header: 'Valore', sortKey: 'valore', className: 'cell-strong', cell: (p) => formatEuro(valoreGiacenza(p), 0) },
        {
            id: 'stato', header: 'Stato',
            cell: (p) => { const s = statoProdotto(p); return <span className={`status-badge status-badge--${s}`}>{STATO_LABEL[s]}</span>; },
        },
    ];

    const rowActions: RowAction<Prodotto>[] = [
        { id: 'view', icon: 'fa-eye', label: 'Dettaglio', onClick: (p) => dlg.openDetail(p.id) },
        ...(perm.update ? [
            { id: 'move', icon: 'fa-right-left', label: 'Movimento di magazzino', onClick: (p: Prodotto) => setMovimentoId(p.id) },
            { id: 'edit', icon: 'fa-pen', label: 'Modifica', onClick: (p: Prodotto) => dlg.openEdit(p.id) },
        ] : []),
        ...(perm.update && multi ? [{ id: 'transfer', icon: 'fa-arrows-left-right-to-line', label: 'Trasferisci', onClick: (p: Prodotto) => setTrasferimentoId(p.id), disabled: (p: Prodotto) => p.giacenza <= 0 && 'Nessuna giacenza da trasferire' }] : []),
        ...(perm.delete ? [{ id: 'delete', icon: 'fa-trash-can', label: 'Elimina', onClick: handleDelete }] : []),
    ];

    const detail = dlg.detail;
    const panelActions: PanelAction[] = detail ? [
        ...(perm.update ? [
            { id: 'move', label: 'Movimento', icon: 'fa-right-left', variant: 'outline' as const, onClick: () => { dlg.closeDetail(); setMovimentoId(detail.id); } },
            { id: 'edit', label: 'Modifica', icon: 'fa-pen', variant: 'outline' as const, onClick: () => dlg.openEdit(detail.id) },
        ] : []),
        ...(perm.update && multi && detail.giacenza > 0 ? [{ id: 'transfer', label: 'Trasferisci', icon: 'fa-arrows-left-right-to-line', variant: 'outline' as const, onClick: () => { dlg.closeDetail(); setTrasferimentoId(detail.id); } }] : []),
        ...(perm.delete ? [{ id: 'delete', label: 'Elimina', icon: 'fa-trash-can', variant: 'danger' as const, onClick: () => { dlg.closeDetail(); handleDelete(detail); } }] : []),
    ] : [];

    const detailMovimenti = useMemo(
        () => (detail ? movimenti.filter((m) => m.prodottoId === detail.id).slice(0, 6) : []),
        [movimenti, detail]
    );
    const nextSku = useMemo(() => nextNumber(config.numbering.sku, prodotti.map((p) => p.sku)), [config.numbering.sku, prodotti]);

    // KPI derivati dal catalogo corrente
    const valoreMagazzino = prodotti.reduce((s, p) => s + valoreGiacenza(p), 0);
    const sottoScorta = prodotti.filter((p) => statoProdotto(p) === 'sotto-scorta').length;
    const esauriti = prodotti.filter((p) => statoProdotto(p) === 'esaurito').length;

    return (
        <>
            <KpiGrid stagger={stagger} items={[
                { icon: 'fa-boxes-stacked', variant: 'stock', label: 'Articoli a Catalogo', value: formatNumber(prodotti.length) },
                { icon: 'fa-coins', variant: 'revenue', label: 'Valore Magazzino', value: formatEuro(valoreMagazzino, 0), trend: { dir: 'up', text: 'a costo d’acquisto' } },
                { icon: 'fa-triangle-exclamation', variant: 'warning', label: 'Sotto Scorta', value: formatNumber(sottoScorta), trend: { dir: 'down', text: 'da riordinare' } },
                { icon: 'fa-circle-xmark', variant: 'danger', label: 'Esauriti', value: formatNumber(esauriti), trend: { dir: 'down', text: 'giacenza zero' } },
            ]} />

            <div style={stagger(4)}>
                <ListToolbar
                    search={list.search}
                    onSearchChange={list.setSearch}
                    searchPlaceholder="Cerca per nome, SKU, fornitore o ubicazione..."
                    chips={{ label: 'Filtra per stato di scorta', value: stato, options: STATO_CHIPS, onChange: (v) => list.setFilter('stato', v) }}
                    onExport={perm.export ? handleExport : undefined}
                    onAdd={perm.create ? dlg.openCreate : undefined}
                    addLabel="Nuovo Prodotto"
                >
                    <ToolbarSelect
                        label="Filtra per categoria"
                        value={categoria}
                        onChange={(v) => list.setFilter('categoria', v)}
                        options={[{ value: 'all', label: 'Tutte le categorie' }, ...tables.categorie]}
                    />
                    {multi && (
                        <ToolbarSelect
                            label="Filtra per magazzino"
                            value={mag}
                            onChange={(v) => list.setFilter('mag', v)}
                            options={[{ value: 'all', label: 'Tutti i magazzini' }, ...magazzini.map((m) => ({ value: String(m.id), label: m.nome }))]}
                        />
                    )}
                </ListToolbar>
            </div>

            <div style={stagger(5)}>
                <DataTable
                    rows={result.rows}
                    columns={columns}
                    sortKey={list.sortKey}
                    sortDir={list.sortDir}
                    onSort={list.toggleSort}
                    actions={rowActions}
                    rowLabel={(p) => p.nome}
                    rowClassName={(p) => (statoProdotto(p) !== 'disponibile' ? 'row--alert' : undefined)}
                    empty={{ icon: 'fa-boxes-packing', text: 'Nessun articolo trovato.' }}
                    pagination={{ total: result.filtered.length, page: result.page, totalPages: result.totalPages, pageSize, onPageChange: list.setPage }}
                />
            </div>

            <ProductDetailPanel
                prodotto={detail}
                fornitore={detail ? nomeFornitore(detail) : ''}
                giacenzePerMagazzino={multi && detail ? magazzini.map((m) => ({ nome: m.nome, quantita: giacenzaIn(detail.giacenze, m.id) })) : undefined}
                movimenti={detailMovimenti}
                open={dlg.detailOpen}
                onClose={dlg.closeDetail}
                actions={panelActions}
            />

            <ProdottoModal
                open={dlg.modalOpen}
                onClose={dlg.closeModal}
                editing={dlg.editing}
                onSubmit={handleSubmit}
                defaults={{ sku: nextSku }}
                fornitori={fornitori}
                saving={createMut.isPending || updateMut.isPending}
            />

            <MovimentoModal
                open={movimentoId != null}
                onClose={() => setMovimentoId(null)}
                prodotto={prodotti.find((p) => p.id === movimentoId) ?? null}
                onSubmit={handleMovimento}
                saving={movimentoMut.isPending}
                magazzini={magazzini}
                magazzinoDefault={mag !== 'all' ? Number(mag) : principale}
            />

            <TrasferimentoModal
                key={trasferimentoId ?? 'none'}
                prodotto={prodotti.find((p) => p.id === trasferimentoId) ?? null}
                magazzini={magazzini}
                onClose={() => setTrasferimentoId(null)}
                saving={trasferimentoMut.isPending}
                onSubmit={(v) => { if (trasferimentoId != null) trasferimentoMut.mutate({ prodottoId: trasferimentoId, ...v }); setTrasferimentoId(null); }}
            />
        </>
    );
}
