import { apiRequest } from '../api';

export type Session = { email: string; tenantId: string; role: string };

function isSession(value: unknown): value is Session {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Partial<Session>;
    return Boolean(candidate.email && candidate.role);
}

export async function loadSession(): Promise<Session | null> {
    try {
        const data = await apiRequest<Session | null>('/api/v1/auth/me', {
            authenticated: false,
            redirectOnUnauthorized: false,
        });
        return isSession(data) ? data : null;
    } catch {
        return null;
    }
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
