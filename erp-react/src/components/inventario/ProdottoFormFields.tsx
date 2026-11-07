import { FormGroup, FormRow, FormTotal, InputBox, SelectBox, TextareaBox } from '../ui/FormField';
import { formatEuro, parseNum } from '../../lib/format';
import type { ProdottoForm } from '../../types/prodotto';
import type { FornitoreRef } from '../../types/fornitore';
import type { FieldErrors } from '../../lib/validation';
import { useConfig } from '../../config/configStore';
import { optionsWithCurrent } from '../../config';

interface ProdottoFormFieldsProps {
    values: ProdottoForm;
    errors: FieldErrors<ProdottoForm>;
    setField: <K extends keyof ProdottoForm>(key: K, value: ProdottoForm[K]) => void;
    /** Anagrafica fornitori (anche inattivi, per risolvere il valore corrente). */
    fornitori?: FornitoreRef[];
    /**
     * 'create' → la giacenza è quella iniziale, modificabile.
     * 'edit'   → la giacenza è in sola lettura: si cambia solo con un
     *            movimento registrato (carico/scarico/rettifica), così
     *            ogni variazione resta tracciata a registro.
     */
    mode: 'create' | 'edit';
}

/**
 * Campi anagrafica prodotto — porting 1:1 del modale "Aggiungi Prodotto"
 * di dashboard.html, esteso con l'ubicazione di magazzino.
 * Condiviso da Inventario.tsx e dalla quick action della Dashboard:
 * stessi campi in entrambi i posti (stesso pattern di ClientFormFields).
 */
export function ProdottoFormFields({ values, errors, setField, mode, fornitori = [] }: ProdottoFormFieldsProps) {
    const { tables } = useConfig();
    const margine = parseNum(values.prezzo) - parseNum(values.costo);
    const isEdit = mode === 'edit';

    // Un articolo esistente può puntare a un fornitore non più attivo (o
    // eliminato): va comunque mostrato, altrimenti la select lo azzererebbe
    // silenziosamente al primo salvataggio.
    const opzioniFornitori = fornitori.filter((f) => f.attivo || String(f.id) === values.fornitoreId);

    return (
        <>
            <FormRow>
                <FormGroup label="Nome prodotto *" error={errors.nome}>
                    <InputBox
                        icon="fa-box"
                        placeholder="Es. Widget Pro X200"
                        value={values.nome}
                        onChange={(e) => setField('nome', e.target.value)}
                    />
                </FormGroup>
                <FormGroup label="Codice SKU *" error={errors.sku}>
                    <InputBox
                        icon="fa-barcode"
                        placeholder="SKU-4522"
                        value={values.sku}
                        onChange={(e) => setField('sku', e.target.value)}
                    />
                </FormGroup>
            </FormRow>

            <FormRow>
                <FormGroup label="Categoria">
                    <SelectBox value={values.categoria} onChange={(e) => setField('categoria', e.target.value)}>
                        {optionsWithCurrent(tables.categorie, values.categoria).map((c) => (
                            <option value={c.value} key={c.value}>{c.label}</option>
                        ))}
                    </SelectBox>
                </FormGroup>
                <FormGroup label="Fornitore">
                    <SelectBox value={values.fornitoreId} onChange={(e) => setField('fornitoreId', e.target.value)}>
                        <option value="">Nessun fornitore</option>
                        {opzioniFornitori.map((f) => (
                            <option value={String(f.id)} key={f.id}>{f.nome}{f.attivo ? '' : ' (non attivo)'}</option>
                        ))}
                    </SelectBox>
                </FormGroup>
            </FormRow>

            <FormRow>
                <FormGroup label="Costo acquisto (€)">
                    <InputBox
                        icon="fa-tag"
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="32.00"
                        value={values.costo}
                        onChange={(e) => setField('costo', e.target.value)}
                    />
                </FormGroup>
                <FormGroup label="Prezzo vendita (€) *" error={errors.prezzo}>
                    <InputBox
                        icon="fa-euro-sign"
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="54.00"
                        value={values.prezzo}
                        onChange={(e) => setField('prezzo', e.target.value)}
                    />
                </FormGroup>
            </FormRow>

            <FormRow>
                <FormGroup label={isEdit ? 'Giacenza attuale' : 'Giacenza iniziale'}>
                    <InputBox
                        icon="fa-warehouse"
                        type="number"
                        min={0}
                        step={1}
                        placeholder="120"
                        value={values.giacenza}
                        disabled={isEdit}
                        title={isEdit ? 'Modificabile solo tramite un movimento di magazzino' : undefined}
                        onChange={(e) => setField('giacenza', e.target.value)}
                    />
                    {isEdit && (
                        <p className="form-hint">
                            Si modifica solo con un movimento, così la variazione resta a registro.
                        </p>
                    )}
                </FormGroup>
                <FormGroup label="Scorta minima">
                    <InputBox
                        icon="fa-triangle-exclamation"
                        type="number"
                        min={0}
                        step={1}
                        placeholder="20"
                        value={values.scorta}
                        onChange={(e) => setField('scorta', e.target.value)}
                    />
                </FormGroup>
            </FormRow>

            <FormRow>
                <FormGroup label="Unità di misura">
                    <SelectBox value={values.unita} onChange={(e) => setField('unita', e.target.value)}>
                        {optionsWithCurrent(tables.unita, values.unita).map((u) => (
                            <option value={u.value} key={u.value}>{u.label}</option>
                        ))}
                    </SelectBox>
                </FormGroup>
                <FormGroup label="Aliquota IVA">
                    <SelectBox value={values.iva} onChange={(e) => setField('iva', e.target.value)}>
                        {optionsWithCurrent(tables.aliquoteIva.map((a) => ({ value: String(a.value), label: a.label })), values.iva).map((a) => (
                            <option value={a.value} key={a.value}>{a.label}</option>
                        ))}
                    </SelectBox>
                </FormGroup>
            </FormRow>

            <FormRow>
                <FormGroup label="Ubicazione a magazzino" full>
                    <InputBox
                        icon="fa-location-dot"
                        placeholder="A-12-3 (corsia-scaffale-ripiano)"
                        value={values.ubicazione}
                        onChange={(e) => setField('ubicazione', e.target.value.toUpperCase())}
                    />
                </FormGroup>
            </FormRow>

            <FormRow>
                <FormTotal label="Margine unitario stimato" value={formatEuro(margine)} />
            </FormRow>

            <FormRow>
                <FormGroup label="Descrizione" full>
                    <TextareaBox
                        rows={3}
                        placeholder="Caratteristiche tecniche, note di magazzino..."
                        value={values.descrizione}
                        onChange={(e) => setField('descrizione', e.target.value)}
                    />
                </FormGroup>
            </FormRow>
        </>
    );
}
