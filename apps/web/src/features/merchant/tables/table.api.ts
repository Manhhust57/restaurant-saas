import { apiRequest } from '../../../shared/api/client';

import type { TableItem as Table, TableDetail } from '../merchant.types';
export type { TableItem as Table } from '../merchant.types';
export const listTables = (branchId?: string) => apiRequest<Table[]>(`/api/v1/tables${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ''}`);
export const getTable = (id: string) => apiRequest<TableDetail>(`/api/v1/tables/${id}`);
export const createTable = (payload: Omit<Table, 'id'>) => apiRequest<Table>('/api/v1/tables', { method: 'POST', body: JSON.stringify(payload) });
export const updateTable = (id: string, payload: Partial<Omit<Table, 'id'>>) => apiRequest<Table>(`/api/v1/tables/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
