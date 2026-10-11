import { apiRequest } from '../../../shared/api/client';

export type Category = { id: string; name: string; sortOrder: number };
export const listCategories = () => apiRequest<Category[]>('/api/v1/categories');
export const createCategory = (payload: Pick<Category, 'name'> & Partial<Pick<Category, 'sortOrder'>>) => apiRequest<Category>('/api/v1/categories', { method: 'POST', body: JSON.stringify(payload) });
export const deactivateCategory = (id: string) => apiRequest<Category>(`/api/v1/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
