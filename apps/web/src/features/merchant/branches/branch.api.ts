import { apiRequest } from '../../../shared/api/client';

import type { Branch, BranchDetail } from '../merchant.types';
export type { Branch } from '../merchant.types';
export const listBranches = () => apiRequest<Branch[]>('/api/v1/branches');
export const getBranch = (id: string) => apiRequest<BranchDetail>(`/api/v1/branches/${id}`);
export const createBranch = (payload: Pick<Branch, 'name' | 'code' | 'address'>) => apiRequest<Branch>('/api/v1/branches', { method: 'POST', body: JSON.stringify(payload) });
export const updateBranch = (id: string, payload: Partial<Pick<Branch, 'name' | 'code' | 'address'>>) => apiRequest<Branch>(`/api/v1/branches/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
export const deleteBranch = (id: string) => apiRequest<Branch>(`/api/v1/branches/${encodeURIComponent(id)}`, { method: 'DELETE' });
