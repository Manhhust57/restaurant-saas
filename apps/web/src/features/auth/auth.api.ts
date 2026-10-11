import { apiRequest } from '../../shared/api';

export const login = (email: string, password: string) =>
    apiRequest<{ user: { email: string; tenantId: string; role: string } }>('/api/v1/auth/login', {
        authenticated: false,
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

export type StaffRole = 'MANAGER' | 'CASHIER' | 'WAITER' | 'KITCHEN';

export const registerStaff = (payload: {
    email: string;
    password: string;
    fullName: string;
    role: StaffRole;
}) =>
    apiRequest<{ id: string; email: string; fullName: string; tenantId: string; role: string }>(
        '/api/v1/auth/register',
        { method: 'POST', body: JSON.stringify(payload) },
    );
