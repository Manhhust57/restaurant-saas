import { apiRequest } from '../api';

export type Session = { email: string; tenantId: string; role: string };

export function loadSession() {
    localStorage.removeItem('restaurant_access_token');
    return apiRequest<Session>('/api/v1/auth/me', { redirectOnUnauthorized: false }).catch(() => null);
}

export async function logout() {
    localStorage.removeItem('restaurant_access_token');
    try {
        await apiRequest('/api/v1/auth/logout', { method: 'POST', authenticated: false });
    } catch {
        // The cookie is cleared by the browser when the request succeeds. A failed call still leaves the login page.
    }
    window.location.href = '/login';
}
