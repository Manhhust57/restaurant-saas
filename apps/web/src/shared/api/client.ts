export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

type ApiOptions = RequestInit & { authenticated?: boolean; redirectOnUnauthorized?: boolean };

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
    const { authenticated = true, redirectOnUnauthorized = authenticated, ...requestOptions } = options;
    const headers = new Headers(requestOptions.headers);
    if (!(requestOptions.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...requestOptions,
        headers,
        credentials: 'include',
    });

    if (response.status === 401 && redirectOnUnauthorized && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    if (!response.ok) {
        let message = `API ${response.status}`;
        try {
            const body = await response.json() as { message?: string | string[] };
            if (Array.isArray(body.message)) message = body.message.join(' ');
            else if (body.message) message = body.message;
        } catch {
            // Keep the status message when the body is not JSON.
        }
        throw new Error(message);
    }

    return response.json() as Promise<T>;
}
