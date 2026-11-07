import { useState } from 'react';
import { DataTable, ListToolbar, type Column, type RowAction } from '../../data';
import { Modal } from '../../ui/Modal';
import { ActionButton } from '../../ui/Button';
import { FormGroup, FormRow, InputBox, SelectBox } from '../../ui/FormField';
import { useToast } from '../../ui/toastContext';
import { useConfirm } from '../../ui/confirmContext';
import { useAnnullaConta, useApriConta, useChiudiConta, useConte, useMagazzini, useSalvaConteggi } from '../../../data';
import { usePermissions } from '../../../auth/hooks';
import { useConfig } from '../../../config/configStore';
import { formatDate, formatEuro, formatNumber, today } from '../../../lib/format';
import { exportCsv } from '../../../lib/csv';
import { differenza, riepilogoConta, STATO_CONTA_LABEL, type ContaInventario } from '../../../types/magazzino';

/**
 * Inventario fisico: apertura (snapshot delle giacenze a sistema), conteggio
 * anche in più sessioni, chiusura con rettifiche automatiche delle sole
 * righe contate che presentano differenze.
 */
export function ConteView() {
    const { toast } = useToast();
    const { confirm } = useConfirm();
    const perm = usePermissions('magazzino');
    const { tables, features } = useConfig();
    const { data: conte = [] } = useConte();
    const { data: magazzini = [] } = useMagazzini();
    const [apertura, setApertura] = useState(false);
    const [contaId, setContaId] = useState<number | null>(null);

    const onError = (e: Error) => toast(e.message, 'error');
    const apri = useApriConta({ onSuccess: (c) => { toast(`Inventario ${c.numero} aperto: ${c.righe.length} articoli da contare.`, 'success'); setContaId(c.id); }, onError });
    const salva = useSalvaConteggi({ onSuccess: () => toast('Conteggi salvati.', 'success'), onError });
    const chiudi = useChiudiConta({ onSuccess: (r) => toast(`Inventario ${r.conta.numero} chiuso: ${r.rettifiche} rettifiche registrate.`, 'success'), onError });
    const annulla = useAnnullaConta({ onSuccess: (c) => toast(`Inventario ${c.numero} annullato.`, 'info'), onError });

    const nomeMag = (id: number) => magazzini.find((m) => m.id === id)?.nome ?? `#${id}`;
    const ordinate = [...conte].sort((a, b) => b.id - a.id);

    const columns: Column<ContaInventario>[] = [
        { id: 'numero', header: 'Numero', className: 'cell-sku', cell: (c) => c.numero },
        { id: 'data', header: 'Data', cell: (c) => formatDate(c.data) },
        ...(features.multiMagazzino ? [{ id: 'mag', header: 'Magazzino', cell: (c: ContaInventario) => nomeMag(c.magazzinoId) }] : []),
        { id: 'cat', header: 'Categoria', cell: (c) => c.categoria || 'Tutte' },
        { id: 'prog', header: 'Avanzamento', cell: (c) => { const r = riepilogoConta(c); return `${r.contate}/${r.righe}`; } },
        { id: 'diff', header: 'Differenze', cell: (c) => { const r = riepilogoConta(c); return r.conDifferenza ? `${r.conDifferenza} (${formatEuro(r.valoreDifferenze)})` : '—'; } },
        { id: 'stato', header: 'Stato', cell: (c) => <span className={`status-badge status-badge--${c.stato === 'aperta' ? 'in-preparazione' : c.stato === 'chiusa' ? 'consegnato' : 'annullato'}`}>{STATO_CONTA_LABEL[c.stato]}</span> },
    ];

    const actions: RowAction<ContaInventario>[] = [
        { id: 'open', icon: 'fa-clipboard-list', label: 'Apri', onClick: (c) => setContaId(c.id) },
        { id: 'csv', icon: 'fa-file-export', label: 'Esporta', onClick: (c) => exportCsv(`inventario_${c.numero}`, c.righe, [
            { header: 'SKU', value: (r) => r.sku }, { header: 'Articolo', value: (r) => r.nome }, { header: 'A sistema', value: (r) => r.attesa },
            { header: 'Contata', value: (r) => r.contata ?? '' }, { header: 'Differenza', value: (r) => (r.contata == null ? '' : differenza(r)) },
            { header: 'Valore differenza', value: (r) => (r.contata == null ? '' : differenza(r) * r.costo) },
        ]) },
    ];

    return (
        <>
            <ListToolbar onAdd={perm.update ? () => setApertura(true) : undefined} addLabel="Nuovo inventario" />
            <DataTable
                rows={ordinate}
                columns={columns}
                sortKey=""
                sortDir="desc"
                onSort={() => undefined}
                actions={actions}
                rowLabel={(c) => c.numero}
                empty={{ icon: 'fa-clipboard-list', text: 'Nessun inventario fisico: aprine uno per contare la merce a scaffale.' }}
                pagination={{ total: ordinate.length, page: 1, totalPages: 1, pageSize: Math.max(1, ordinate.length), onPageChange: () => undefined }}
            />

            <AperturaModal
                key={apertura ? 'on' : 'off'}
                open={apertura}
                magazzini={magazzini.filter((m) => m.attivo && (features.multiMagazzino || m.principale))}
                categorie={tables.categorie}
                onClose={() => setApertura(false)}
                onSubmit={(v) => { apri.mutate(v); setApertura(false); }}
            />

            <ContaModal
                key={contaId ?? 'none'}
                conta={conte.find((c) => c.id === contaId) ?? null}
                canEdit={perm.update}
                onClose={() => setContaId(null)}
                onSave={(contate) => contaId != null && salva.mutate({ id: contaId, contate })}
                onChiudi={(contate) => {
                    if (contaId == null) return;
                    confirm({
                        title: 'Chiudere l’inventario?',
                        text: 'Le giacenze delle righe contate verranno rettificate ai valori contati. Le righe non contate restano invariate.',
                        confirmLabel: 'Chiudi e rettifica',
                        icon: 'fa-clipboard-check',
                        tone: 'accent',
                        onConfirm: async () => {
                            await salva.mutateAsync({ id: contaId, contate });
                            chiudi.mutate(contaId);
                            setContaId(null);
                        },
                    });
                }}
                onAnnulla={() => contaId != null && confirm({
                    title: 'Annullare l’inventario?', text: 'I conteggi non verranno applicati.', confirmLabel: 'Annulla inventario', icon: 'fa-ban',
                    onConfirm: () => { annulla.mutate(contaId); setContaId(null); },
                })}
            />
        </>
    );
}

function AperturaModal({ open, magazzini, categorie, onClose, onSubmit }: {
    open: boolean;
    magazzini: Array<{ id: number; nome: string; principale: boolean }>;
    categorie: Array<{ value: string; label: string }>;
    onClose: () => void;
    onSubmit: (v: { magazzinoId: number; categoria: string; data: string; note: string }) => void;
}) {
    const [magazzinoId, setMagazzinoId] = useState(() => magazzini.find((m) => m.principale)?.id ?? magazzini[0]?.id ?? 0);
    const [categoria, setCategoria] = useState('');
    const [data, setData] = useState(today);
    return (
        <Modal open={open} onClose={onClose} title="Nuovo inventario fisico" size="sm"
            footer={<><ActionButton variant="outline" onClick={onClose}>Annulla</ActionButton><ActionButton icon="fa-clipboard-list" disabled={!magazzinoId} onClick={() => onSubmit({ magazzinoId, categoria, data, note: '' })}>Apri inventario</ActionButton></>}>
            <FormRow>
                <FormGroup label="Magazzino">
                    <SelectBox value={magazzinoId} onChange={(e) => setMagazzinoId(Number(e.target.value))}>
                        {magazzini.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                    </SelectBox>
                </FormGroup>
                <FormGroup label="Categoria">
                    <SelectBox value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                        <option value="">Tutte le categorie</option>
                        {categorie.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </SelectBox>
                </FormGroup>
            </FormRow>
            <FormRow>
                <FormGroup label="Data di riferimento">
                    <InputBox icon="fa-calendar-day" type="date" value={data} onChange={(e) => setData(e.target.value)} />
                </FormGroup>
            </FormRow>
            <p className="form-hint--static">All’apertura viene fotografata la giacenza a sistema di ogni articolo: è il termine di confronto dei conteggi.</p>
        </Modal>
    );
}

function ContaModal({ conta, canEdit, onClose, onSave, onChiudi, onAnnulla }: {
    conta: ContaInventario | null;
    canEdit: boolean;
    onClose: () => void;
    onSave: (contate: Array<number | null>) => void;
    onChiudi: (contate: Array<number | null>) => void;
    onAnnulla: () => void;
}) {
    const [contate, setContate] = useState<Array<number | null>>(() => conta?.righe.map((r) => r.contata) ?? []);
    const [soloDiff, setSoloDiff] = useState(false);
    if (!conta) return null;
    const editabile = canEdit && conta.stato === 'aperta';
    const righe = conta.righe.map((r, i) => ({ ...r, contata: contate[i] ?? null, i }));
    const r = riepilogoConta({ righe });
    const visibili = soloDiff ? righe.filter((x) => x.contata != null && differenza(x) !== 0) : righe;

    return (
        <Modal
            open
            onClose={onClose}
            title={`Inventario ${conta.numero} — ${STATO_CONTA_LABEL[conta.stato]}`}
            footer={editabile ? (
                <>
                    <ActionButton variant="danger" icon="fa-ban" onClick={onAnnulla}>Annulla inventario</ActionButton>
                    <ActionButton variant="outline" icon="fa-floppy-disk" onClick={() => onSave(contate)}>Salva conteggi</ActionButton>
                    <ActionButton icon="fa-clipboard-check" disabled={r.contate === 0} onClick={() => onChiudi(contate)}>Chiudi e rettifica</ActionButton>
                </>
            ) : <ActionButton variant="outline" onClick={onClose}>Chiudi</ActionButton>}
        >
            <div className="conta-summary">
                <span>Contati <strong>{r.contate}/{r.righe}</strong></span>
                <span>Con differenza <strong>{r.conDifferenza}</strong></span>
                <span>Valore differenze <strong className={r.valoreDifferenze < 0 ? 'neg' : undefined}>{formatEuro(r.valoreDifferenze)}</strong></span>
                <button type="button" className={`chip-btn chip-btn--toggle${soloDiff ? ' active' : ''}`} aria-pressed={soloDiff} onClick={() => setSoloDiff((x) => !x)}>Solo differenze</button>
            </div>
            <ul className="righe-list conta-list">
                <li className="riga-item riga-item--head conta-row" aria-hidden="true"><span>Articolo</span><span>A sistema</span><span>Contata</span><span>Diff.</span></li>
                {visibili.map((x) => {
                    const d = differenza(x);
                    return (
                        <li key={x.prodottoId} className={`riga-item conta-row${x.contata != null && d !== 0 ? ' riga-item--warn' : ''}`}>
                            <div className="riga-prod"><span className="riga-nome">{x.nome}</span><span className="riga-sku">{x.sku}</span></div>
                            <span>{formatNumber(x.attesa)} {x.unita}</span>
                            <input
                                className="riga-input"
                                type="number"
                                min={0}
                                disabled={!editabile}
                                aria-label={`Quantità contata ${x.nome}`}
                                placeholder="—"
                                value={x.contata ?? ''}
                                onChange={(e) => {
                                    const v = e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0);
                                    setContate((cs) => cs.map((c, j) => (j === x.i ? v : c)));
                                }}
                            />
                            <span className={d < 0 ? 'neg' : d > 0 ? 'pos' : undefined}>{x.contata == null ? '' : `${d > 0 ? '+' : ''}${formatNumber(d)}`}</span>
                        </li>
                    );
                })}
            </ul>
        </Modal>
    );
}
