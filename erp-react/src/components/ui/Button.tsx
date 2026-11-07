import type { ButtonHTMLAttributes } from 'react';
import '../../styles/erp-ui.css';

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'outline' | 'danger';
    icon?: string;
}

/** .neu-action-btn: pulsante d'azione neumorfico (usato in modali/toolbar). */
export function ActionButton({ variant = 'primary', icon, children, className, ...rest }: ActionButtonProps) {
    const variantClass = variant === 'outline' ? ' neu-action-btn--outline' : variant === 'danger' ? ' neu-action-btn--danger' : '';
    return (
        <button type="button" className={`neu-action-btn${variantClass}${className ? ' ' + className : ''}`} {...rest}>
            {icon && <i className={`fa-solid ${icon}`} />}
            {children}
        </button>
    );
}
