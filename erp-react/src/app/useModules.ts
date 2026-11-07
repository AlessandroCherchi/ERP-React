import { useConfig, isModuleEnabled } from '../config/configStore';
import { useRole } from '../auth/hooks';
import { can } from '../auth/permissions';
import { MODULES, type ModuleDef } from './modules';

export type ModuleAccess = 'ok' | 'disabled' | 'forbidden';

/** Esito dell'accesso a un modulo per tenant + ruolo correnti. */
export function useModuleAccess(module: ModuleDef): ModuleAccess {
    const config = useConfig();
    const role = useRole();
    if (!isModuleEnabled(config, module.id)) return 'disabled';
    if (!can(role, module.resource, 'read')) return 'forbidden';
    return 'ok';
}

/** Moduli visibili in menu: attivi per il tenant e leggibili dal ruolo. */
export function useVisibleModules(): ModuleDef[] {
    const config = useConfig();
    const role = useRole();
    return MODULES.filter((m) => isModuleEnabled(config, m.id) && can(role, m.resource, 'read'));
}
