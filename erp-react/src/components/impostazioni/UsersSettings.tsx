import { useMemo, useState } from 'react';
import * as v from 'valibot';
import { SettingsCard } from './SettingsCard';
import { DataTable, EntityCell, type Column, type RowAction } from '../data';
import { Modal } from '../ui/Modal';
import { ActionButton } from '../ui/Button';
import { FormGroup, FormRow, InputBox, SelectBox } from '../ui/FormField';
import { useToast } from '../ui/toastContext';
import { useAggiornaUtente, useInvitaUtente, useUtenti } from '../../data';
import { useSession } from '../../auth/session';
import { ROLES, type Role } from '../../auth/permissions';
import { useValidatedForm } from '../../lib/validation';
import { byKey, queryRows } from '../../lib/listQuery';
import { initials } from '../../lib/text';
import type { Utente, UtenteFormValues } from '../../types/utente';
import { useT } from '../../i18n';

const inviteSchema = v.object({
    name: v.pipe(v.string(), v.trim(), v.minLength(1, 'Campo obbligatorio')),
    email: v.pipe(v.string(), v.trim(), v.email('Email non valida')),
    role: v.picklist(ROLES),
});

type SortKey = 'name' | 'email' | 'role';

/** Membri del tenant: invito, cambio ruolo, disattivazione. */
export function UsersSettings({ canEdit }: { canEdit: boolean }) {
    const t = useT();
    const { toast } = useToast();
    const me = useSession()?.user.id;
    const { data: utenti = [] } = useUtenti();
    const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'name', dir: 'asc' });
    const [inviteOpen, setInviteOpen] = useState(false);

    const onError = (e: Error) => toast(e.message, 'error');
    const invite = useInvitaUtente({ onSuccess: (u) => toast(t('settings.users.invited', { name: u.name }), 'success'), onError });
    const aggiorna = useAggiornaUtente({ onSuccess: () => toast(t('settings.users.updated'), 'success'), onError });

    const rows = useMemo(
        () => queryRows(utenti, { sort: { key: sort.key, dir: sort.dir, value: byKey } }).rows,
        [utenti, sort]
    );

    const roleOptions = ROLES.map((r) => ({ value: r, label: t(`roles.${r}`) }));

    const columns: Column<Utente, SortKey>[] = [
        {
            id: 'name', header: t('settings.users.name'), sortKey: 'name',
            cell: (u) => <EntityCell icon={initials(u.name)} label={u.id === me ? `${u.name} (${t('settings.users.you')})` : u.name} onOpen={() => undefined} />,
        },
        { id: 'email', header: t('settings.users.email'), sortKey: 'email', cell: (u) => u.email },
        {
            id: 'role', header: t('settings.users.role'), sortKey: 'role',
            cell: (u) => canEdit && u.id !== me ? (
                <div className="select-box select-box--toolbar select-box--inline">
                    <select value={u.role} aria-label={`${t('settings.users.role')} ${u.name}`} onChange={(e) => aggiorna.mutate({ id: u.id, patch: { role: e.target.value as Role } })}>
                        {roleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <i className="fa-solid fa-chevron-down" />
                </div>
            ) : t(`roles.${u.role}`),
        },
        {
            id: 'status', header: t('settings.users.status'),
            cell: (u) => <span className={`status-badge status-badge--${u.attivo ? 'attivo' : 'inattivo'}`}>{t(u.attivo ? 'settings.users.active' : 'settings.users.inactive')}</span>,
        },
    ];

    // Non ci si disattiva da soli: si perderebbe l'accesso a metà operazione.
    const actions: RowAction<Utente>[] = canEdit ? [{
        id: 'toggle', icon: 'fa-user-slash', label: t('settings.users.deactivate'),
        onClick: (u) => aggiorna.mutate({ id: u.id, patch: { attivo: !u.attivo } }),
        disabled: (u) => u.id === me && t('settings.users.you'),
    }] : [];

    return (
        <SettingsCard title={t('settings.tabs.utenti')} description={t('settings.users.intro')} canEdit>
            {canEdit && (
                <div className="settings-toolbar">
                    <ActionButton icon="fa-user-plus" onClick={() => setInviteOpen(true)}>{t('settings.users.invite')}</ActionButton>
                </div>
            )}
            <DataTable
                rows={rows}
                columns={columns}
                sortKey={sort.key}
                sortDir={sort.dir}
                onSort={(key) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }))}
                actions={actions}
                rowLabel={(u) => u.name}
                rowClassName={(u) => (u.attivo ? undefined : 'row--muted')}
                empty={{ icon: 'fa-users-slash', text: '—' }}
                pagination={{ total: rows.length, page: 1, totalPages: 1, pageSize: Math.max(rows.length, 1), onPageChange: () => undefined }}
            />
            <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} onSubmit={(values) => { invite.mutate(values); setInviteOpen(false); }} roles={roleOptions} />
        </SettingsCard>
    );
}

function InviteModal({ open, onClose, onSubmit, roles }: {
    open: boolean;
    onClose: () => void;
    onSubmit: (v: UtenteFormValues) => void;
    roles: { value: Role; label: string }[];
}) {
    const t = useT();
    const initial: UtenteFormValues = { name: '', email: '', role: 'viewer' };
    const { values, errors, setField, validate, reset } = useValidatedForm<UtenteFormValues>(inviteSchema, initial);

    return (
        <Modal
            open={open}
            onClose={() => { reset(); onClose(); }}
            title={t('settings.users.invite')}
            footer={
                <>
                    <ActionButton variant="outline" onClick={() => { reset(); onClose(); }}>{t('common.cancel')}</ActionButton>
                    <ActionButton icon="fa-paper-plane" onClick={() => { if (validate()) { onSubmit(values); reset(); } }}>{t('settings.users.invite')}</ActionButton>
                </>
            }
        >
            <FormRow>
                <FormGroup label={`${t('settings.users.name')} *`} error={errors.name}>
                    <InputBox icon="fa-user" value={values.name} onChange={(e) => setField('name', e.target.value)} />
                </FormGroup>
                <FormGroup label={`${t('settings.users.email')} *`} error={errors.email}>
                    <InputBox icon="fa-envelope" type="email" value={values.email} onChange={(e) => setField('email', e.target.value)} />
                </FormGroup>
            </FormRow>
            <FormRow>
                <FormGroup label={t('settings.users.role')}>
                    <SelectBox value={values.role} onChange={(e) => setField('role', e.target.value as Role)}>
                        {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </SelectBox>
                </FormGroup>
            </FormRow>
        </Modal>
    );
}
