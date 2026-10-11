import { apiRequest } from '../../shared/api';
import type { Tenant } from '../merchant/merchant.types';

export const getTenant = (id: string) => apiRequest<Tenant>(`/api/v1/tenants/${encodeURIComponent(id)}`);
export const createTenant = (name: string, slug: string) => apiRequest<Tenant>('/api/v1/tenants', {
    method: 'POST', body: JSON.stringify({ name, slug }),
});
export const switchTenant = (tenantId: string) => apiRequest<{ user: { email: string; tenantId: string; role: string } }>('/api/v1/auth/switch-tenant', {
    method: 'POST', body: JSON.stringify({ tenantId }),
});
