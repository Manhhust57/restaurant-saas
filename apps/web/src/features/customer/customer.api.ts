import { apiRequest } from '../../shared/api';
import type { MenuResponse } from './customer.types';

export const getMenu = (token: string) => apiRequest<MenuResponse>(`/api/v1/public/menu/${encodeURIComponent(token)}`, { authenticated: false });
export const submitOrder = (token: string, items: Array<{ productId: string; quantity: number }>) => apiRequest<unknown>(`/api/v1/public/orders/${encodeURIComponent(token)}`, {
    authenticated: false, method: 'POST', body: JSON.stringify({ items }),
});
