import { apiRequest } from '../../../shared/api';

export type SalesSummary = {
    filters: { branchId?: string; from?: string; to?: string };
    totals: { orders: number; subtotal: number; discount: number; revenue: number };
    statuses: Array<{ status: string; orders: number }>;
    daily: Array<{ date: string; orders: number; revenue: number }>;
};

export function getSalesSummary(params: { branchId?: string; from?: string; to?: string } = {}) {
    const query = new URLSearchParams();
    if (params.branchId) query.set('branchId', params.branchId);
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);
    const suffix = query.toString() ? `?${query}` : '';
    return apiRequest<SalesSummary>(`/api/v1/reports/sales${suffix}`);
}
