import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import '../../styles/erp-ui.css';

interface FormGroupProps {
    label: string;
    error?: string;
    full?: boolean;
    children: ReactNode;
}

/** Wrapper .form-group: label + campo + stato d'errore, identico a erp-ui.css. */
export function FormGroup({ label, error, full, children }: FormGroupProps) {
    return (
        <div className={`form-group${full ? ' form-group--full' : ''}${error ? ' has-error' : ''}`}>
            <label>{label}</label>
            {children}
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
    return (
        <div className="input-box">
            <i className={`fa-solid ${icon}`} />
            <input {...inputProps} />
        </div>
    );
}

interface SelectBoxProps extends SelectHTMLAttributes<HTMLSelectElement> {
    children: ReactNode;
}

/** .select-box: select neumorfico con chevron. */
export function SelectBox({ children, ...selectProps }: SelectBoxProps) {
    return (
        <div className="select-box">
            <select {...selectProps}>{children}</select>
            <i className="fa-solid fa-chevron-down" />
        </div>
    );
}

type TextareaBoxProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/** .textarea-box: textarea neumorfica. */
export function TextareaBox(props: TextareaBoxProps) {
    return (
        <div className="textarea-box">
            <textarea {...props} />
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
