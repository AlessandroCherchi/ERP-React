import { useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { ActionButton } from '../../ui/Button';
import { FormGroup, FormRow, InputBox, SelectBox } from '../../ui/FormField';
import { useValidatedForm } from '../../../lib/validation';
import { reportSchema } from '../../../lib/schemas/quickActions';
import { EMPTY_REPORT, type ReportForm } from '../../../types/quickActions';

interface ReportModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: ReportForm) => void;
}

/** Modale "Scarica Report" — porting 1:1 di #modalReport in dashboard.html. */
export function ReportModal({ open, onClose, onSubmit }: ReportModalProps) {
    const { values, errors, setField, validate, reset } = useValidatedForm<ReportForm>(reportSchema, EMPTY_REPORT);

    useEffect(() => {
        if (open) reset(EMPTY_REPORT);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    function handleSave() {
        if (!validate()) return;
        onSubmit(values);
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Scarica Report"
            size="sm"
            footer={
                <>
                    <ActionButton variant="outline" onClick={onClose}>Annulla</ActionButton>
                    <ActionButton icon="fa-download" onClick={handleSave}>Genera e Scarica</ActionButton>
                </>
            }
        >
            <FormRow>
                <FormGroup label="Tipo di report *" error={errors.tipo} full>
                    <SelectBox value={values.tipo} onChange={(e) => setField('tipo', e.target.value)}>
                        <option value="fatturato">Andamento fatturato</option>
                        <option value="prodotti">Top prodotti del mese</option>
                        <option value="attivita">Registro attività</option>
                        <option value="kpi">Riepilogo KPI</option>
                    </SelectBox>
                </FormGroup>
            </FormRow>

            <FormRow>
                <FormGroup label="Periodo" full>
                    <SelectBox value={values.periodo} onChange={(e) => setField('periodo', e.target.value)}>
                        <option value="7d">Ultimi 7 giorni</option>
                        <option value="30d">Ultimi 30 giorni</option>
                        <option value="12m">Ultimi 12 mesi</option>
                        <option value="custom">Intervallo personalizzato</option>
                    </SelectBox>
                </FormGroup>
            </FormRow>

            {values.periodo === 'custom' && (
                <FormRow>
                    <FormGroup label="Dal">
                        <InputBox icon="fa-calendar-day" type="date" value={values.dal}
                            onChange={(e) => setField('dal', e.target.value)} />
                    </FormGroup>
                    <FormGroup label="Al">
                        <InputBox icon="fa-calendar-check" type="date" value={values.al}
                            onChange={(e) => setField('al', e.target.value)} />
                    </FormGroup>
                </FormRow>
            )}

            <FormRow>
                <FormGroup label="Formato file" full>
                    <SelectBox value={values.formato} onChange={(e) => setField('formato', e.target.value)}>
                        <option value="csv">CSV — compatibile con Excel</option>
                        <option value="json">JSON — per integrazioni</option>
                    </SelectBox>
                </FormGroup>
            </FormRow>

            <FormRow>
                <p className="form-hint form-group--full">
                    Il file viene generato dai dati attualmente visualizzati nella dashboard
                    e scaricato direttamente sul tuo dispositivo.
                </p>
            </FormRow>
        </Modal>
    );
}
