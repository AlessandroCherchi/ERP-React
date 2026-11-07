// Registro dei tenant disponibili in questa build.
// Con il backend il config arriverà da /api/v1/tenant (stessa forma):
// questo registro resterà come fallback offline e per le demo commerciali.

import type { TenantOverride } from '../types';
import { acme } from './acme';

export const TENANTS: Record<string, TenantOverride> = {
    default: {},
    acme,
};
