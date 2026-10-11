import { apiRequest } from '../../shared/api';
import type { KitchenTicket } from '../../shared/types/order';

export const listTickets = () => apiRequest<KitchenTicket[]>('/api/v1/kitchen/tickets');

export const updateTicketStatus = (id: string, status: string) =>
    apiRequest<unknown>(`/api/v1/kitchen/orders/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });

export const updateItemStatus = (orderId: string, itemId: string, status: string) =>
    apiRequest<unknown>(
        `/api/v1/kitchen/orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(itemId)}`,
        { method: 'PATCH', body: JSON.stringify({ status }) },
    );
