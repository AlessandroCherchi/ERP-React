import { useEffect } from 'react';
import * as v from 'valibot';
import { DataTable, ListToolbar, type Column, type RowAction } from '../../data';
import { Modal } from '../../ui/Modal';
import { ActionButton } from '../../ui/Button';
import { FormGroup, FormRow, InputBox } from '../../ui/FormField';
import { useToast } from '../../ui/toastContext';
import { useCrudDialogs } from '../../../hooks/useCrudDialogs';
import { useDeleteConfirm } from '../../../hooks/useDeleteConfirm';
import { useCreateMagazzino, useDeleteMagazzino, useMagazzini, useProdotti, useUpdateMagazzino } from '../../../data';
import { usePermissions } from '../../../auth/hooks';
import { useValidatedForm } from '../../../lib/validation';
import { formatEuro, formatNumber } from '../../../lib/format';
import { EMPTY_MAGAZZINO_FORM, giacenzaIn, type Magazzino, type MagazzinoFormValues } from '../../../types/magazzino';

const schema = v.object({
    codice: v.pipe(v.string(), v.trim(), v.minLength(2, 'Almeno 2 caratteri'), v.maxLength(10, 'Massimo 10 caratteri')),
    nome: v.pipe(v.string(), v.trim(), v.minLength(1, 'Campo obbligatorio')),
    indirizzo: v.string(),
    principale: v.boolean(),
    attivo: v.boolean(),
});

/** Anagrafica magazzini con giacenza e valore per sede. */
export function MagazziniView() {
    const { toast } = useToast();
    const confirmDelete = useDeleteConfirm();
    const perm = usePermissions('magazzino');
    const { data: magazzini = [] } = useMagazzini();
    const { data: prodotti = [] } = useProdotti();
    const dlg = useCrudDialogs(magazzini);

    const onError = (e: Error) => toast(e.message, 'error');
    const create = useCreateMagazzino({ onSuccess: (m) => toast(`Magazzino ${m.codice} creato.`, 'success'), onError });
    const update = useUpdateMagazzino({ onSuccess: (m) => toast(`Magazzino ${m.codice} aggiornato.`, 'success'), onError });
    const remove = useDeleteMagazzino({ onSuccess: () => toast('Magazzino eliminato.', 'info'), onError });

    const pezzi = (id: number) => prodotti.reduce((s, p) => s + giacenzaIn(p.giacenze, id), 0);
    const valore = (id: number) => prodotti.reduce((s, p) => s + giacenzaIn(p.giacenze, id) * p.costo, 0);

    const columns: Column<Magazzino>[] = [
        { id: 'codice', header: 'Codice', className: 'cell-sku', cell: (m) => m.codice },
        { id: 'nome', header: 'Magazzino', cell: (m) => <>{m.nome}{m.principale && <em className="nav-badge">principale</em>}</> },
        { id: 'indirizzo', header: 'Indirizzo', cell: (m) => m.indirizzo || '—' },
        { id: 'pezzi', header: 'Pezzi', cell: (m) => formatNumber(pezzi(m.id)) },
        { id: 'valore', header: 'Valore', className: 'cell-strong', cell: (m) => formatEuro(valore(m.id), 0) },
        { id: 'stato', header: 'Stato', cell: (m) => <span className={`status-badge status-badge--${m.attivo ? 'attivo' : 'inattivo'}`}>{m.attivo ? 'Attivo' : 'Inattivo'}</span> },
    ];

    const actions: RowAction<Magazzino>[] = [
        ...(perm.update ? [{ id: 'edit', icon: 'fa-pen', label: 'Modifica', onClick: (m: Magazzino) => dlg.openEdit(m.id) }] : []),
        ...(perm.delete ? [{
            id: 'delete', icon: 'fa-trash-can', label: 'Elimina',
            onClick: (m: Magazzino) => confirmDelete(`il magazzino "${m.nome}"`, () => remove.mutate({ id: m.id, giacenza: pezzi(m.id) })),
            disabled: (m: Magazzino) => (m.principale ? 'Magazzino principale' : pezzi(m.id) > 0 ? 'Contiene merce' : false),
        }] : []),
    ];

    return (
        <>
            <ListToolbar onAdd={perm.create ? dlg.openCreate : undefined} addLabel="Nuovo Magazzino" />
            <DataTable
                rows={magazzini}
                columns={columns}
                sortKey=""
                sortDir="asc"
                onSort={() => undefined}
                actions={actions}
                rowLabel={(m) => m.nome}
                empty={{ icon: 'fa-warehouse', text: 'Nessun magazzino.' }}
                pagination={{ total: magazzini.length, page: 1, totalPages: 1, pageSize: Math.max(1, magazzini.length), onPageChange: () => undefined }}
            />
            <MagazzinoModal
                open={dlg.modalOpen}
                editing={dlg.editing}
                onClose={dlg.closeModal}
                onSubmit={(values) => {
                    if (dlg.editingId != null) update.mutate({ id: dlg.editingId, data: values });
                    else create.mutate(values);
                    dlg.closeModal();
                }}
            />
        </>
    );
}

function MagazzinoModal({ open, editing, onClose, onSubmit }: {
    open: boolean;
    editing: Magazzino | null;
    onClose: () => void;
    onSubmit: (v: MagazzinoFormValues) => void;
}) {
    const { values, errors, setField, validate, reset } = useValidatedForm<MagazzinoFormValues>(schema, EMPTY_MAGAZZINO_FORM);
    useEffect(() => {
        if (open) reset(editing ? { codice: editing.codice, nome: editing.nome, indirizzo: editing.indirizzo, principale: editing.principale, attivo: editing.attivo } : EMPTY_MAGAZZINO_FORM);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, editing]);

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={editing ? `Modifica ${editing.codice}` : 'Nuovo Magazzino'}
            size="sm"
            footer={
                <>
                    <ActionButton variant="outline" onClick={onClose}>Annulla</ActionButton>
                    <ActionButton icon="fa-check" onClick={() => validate() && onSubmit(values)}>Salva</ActionButton>
                </>
            }
        >
            <FormRow>
                <FormGroup label="Codice *" error={errors.codice}>
                    <InputBox icon="fa-hashtag" value={values.codice} maxLength={10} onChange={(e) => setField('codice', e.target.value.toUpperCase())} />
                </FormGroup>
                <FormGroup label="Nome *" error={errors.nome}>
                    <InputBox icon="fa-warehouse" value={values.nome} onChange={(e) => setField('nome', e.target.value)} />
                </FormGroup>
            </FormRow>
            <FormRow>
                <FormGroup label="Indirizzo" full>
                    <InputBox icon="fa-location-dot" value={values.indirizzo} onChange={(e) => setField('indirizzo', e.target.value)} />
                </FormGroup>
            </FormRow>
            <div className="check-inline">
                <label><input type="checkbox" checked={values.principale} onChange={(e) => setField('principale', e.target.checked)} /> Magazzino principale (vendite e acquisti)</label>
                <label><input type="checkbox" checked={values.attivo} onChange={(e) => setField('attivo', e.target.checked)} /> Attivo</label>
            </div>
        </Modal>
    );
}
