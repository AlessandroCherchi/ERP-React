// Stato dei pannelli/modali di una pagina CRUD: dettaglio aperto, modale
// di creazione/modifica. Le pagine elenco lo ripetevano identico: qui le
// entità restano referenziate per id e risolte dalla lista corrente, così
// dopo un aggiornamento il pannello mostra sempre il dato fresco.

import { useState } from 'react';

export function useCrudDialogs<T extends { id: number }>(rows: readonly T[]) {
    const [detailId, setDetailId] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const find = (id: number | null) => (id == null ? null : rows.find((r) => r.id === id) ?? null);

    return {
        detail: find(detailId),
        detailOpen: detailId != null,
        openDetail: (id: number) => setDetailId(id),
        closeDetail: () => setDetailId(null),

        editing: find(editingId),
        modalOpen,
        openCreate: () => { setEditingId(null); setModalOpen(true); },
        openEdit: (id: number) => { setDetailId(null); setEditingId(id); setModalOpen(true); },
        closeModal: () => setModalOpen(false),
        /** Id in modifica (null = creazione) — da leggere al submit. */
        editingId,
    };
}
