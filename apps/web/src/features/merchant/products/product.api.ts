import { apiRequest } from '../../../shared/api/client';

export type Product = { id: string; categoryId: string; name: string; description?: string | null; price: number | string; imageUrl?: string | null; isActive: boolean };
export const listProducts = () => apiRequest<Product[]>('/api/v1/products');
export const uploadProductImage = (file: File) => {
    const body = new FormData();
    body.append('file', file);
    return apiRequest<{ imageUrl: string }>('/api/v1/products/images', { method: 'POST', body });
};
export const createProduct = (payload: Omit<Product, 'id' | 'isActive'>) => apiRequest<Product>('/api/v1/products', { method: 'POST', body: JSON.stringify(payload) });
export const deactivateProduct = (id: string) => apiRequest<Product>(`/api/v1/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
