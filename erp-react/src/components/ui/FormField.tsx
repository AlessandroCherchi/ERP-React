import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { FieldIdContext, useFieldId } from './fieldId';
import '../../styles/erp-ui.css';

interface FormGroupProps {
    label: string;
    error?: string;
    full?: boolean;
    children: ReactNode;
}

/** Wrapper .form-group: label + campo + stato d'errore, identico a erp-ui.css. */
export function FormGroup({ label, error, full, children }: FormGroupProps) {
    const id = useId();
    return (
        <div className={`form-group${full ? ' form-group--full' : ''}${error ? ' has-error' : ''}`}>
            <label htmlFor={id}>{label}</label>
            <FieldIdContext.Provider value={id}>{children}</FieldIdContext.Provider>
            {error && <span className="form-error" role="alert">{error}</span>}
        </div>
    );
}

export function FormRow({ children }: { children: ReactNode }) {
    return <div className="form-row">{children}</div>;
}

interface InputBoxProps extends InputHTMLAttributes<HTMLInputElement> {
    icon: string;
}

/** .input-box: input con icona Font Awesome, stesso stile neumorfico del login. */
export function InputBox({ icon, ...inputProps }: InputBoxProps) {
    const id = useFieldId();
    return (
        <div className="input-box">
            <i className={`fa-solid ${icon}`} />
            <input id={id} {...inputProps} />
        </div>
    );
}

interface SelectBoxProps extends SelectHTMLAttributes<HTMLSelectElement> {
    children: ReactNode;
}

/** .select-box: select neumorfico con chevron. */
export function SelectBox({ children, ...selectProps }: SelectBoxProps) {
    const id = useFieldId();
    return (
        <div className="select-box">
            <select id={id} {...selectProps}>{children}</select>
            <i className="fa-solid fa-chevron-down" />
        </div>
    );
}

type TextareaBoxProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/** .textarea-box: textarea neumorfica. */
export function TextareaBox(props: TextareaBoxProps) {
    const id = useFieldId();
    return (
        <div className="textarea-box">
            <textarea id={id} {...props} />
        </div>
    );
}

/** .form-total: riepilogo calcolato (es. totale ordine/fattura). */
export function FormTotal({ label, value }: { label: string; value: string }) {
    return (
        <div className="form-total">
            <span className="form-total-label">{label}</span>
            <span className="form-total-value">{value}</span>
        </div>
    );
}
