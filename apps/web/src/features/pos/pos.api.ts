import { apiRequest } from '../../shared/api';
import type { PosOrder } from '../../shared/types/order';

export type OrderItemPayload = { productId: string; quantity: number; note?: string };

export const listOrders = () => apiRequest<PosOrder[]>('/api/v1/orders');

export const getOrder = (id: string) =>
    apiRequest<PosOrder>(`/api/v1/orders/${encodeURIComponent(id)}`);

export const confirmOrder = (id: string) =>
    apiRequest<PosOrder>(`/api/v1/orders/${encodeURIComponent(id)}/confirm`, { method: 'POST' });

export const createOrder = (payload: {
    branchId: string;
    tableId?: string;
    note?: string;
    items: OrderItemPayload[];
}) =>
    apiRequest<PosOrder>('/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
    });

export const addOrderItems = (orderId: string, items: OrderItemPayload[]) =>
    apiRequest<PosOrder>(`/api/v1/orders/${encodeURIComponent(orderId)}/items`, {
        method: 'POST',
        body: JSON.stringify({ items }),
    });

export const updateOrderItem = (
    orderId: string,
    itemId: string,
    payload: { quantity: number; note?: string },
) =>
    apiRequest<PosOrder>(
        `/api/v1/orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(itemId)}`,
        {
            method: 'PATCH',
            body: JSON.stringify(payload),
        },
    );

export const cancelOrderItem = (orderId: string, itemId: string) =>
    apiRequest<PosOrder>(
        `/api/v1/orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(itemId)}/cancel`,
        { method: 'POST' },
    );

export const cancelOrder = (orderId: string) =>
    apiRequest<PosOrder>(`/api/v1/orders/${encodeURIComponent(orderId)}/cancel`, {
        method: 'POST',
    });

export const createPayment = (
    orderId: string,
    payload: { method: string; amount: number; transactionId?: string },
) =>
    apiRequest<unknown>(`/api/v1/payments/orders/${encodeURIComponent(orderId)}`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
