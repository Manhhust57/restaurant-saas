import { homePathForRole } from './homePathForRole';

export type NavItem = { path: string; label: string };

const ALL_NAV: NavItem[] = [
    { path: '/', label: 'Home' },
    { path: '/customer', label: 'Customer' },
    { path: '/pos', label: 'POS' },
    { path: '/kitchen', label: 'Kitchen' },
    { path: '/admin', label: 'Merchant Admin' },
    { path: '/saas', label: 'SaaS Admin' },
];

const ROLE_PATHS: Record<string, string[]> = {
    OWNER: ['/', '/customer', '/pos', '/kitchen', '/admin', '/saas'],
    MANAGER: ['/', '/customer', '/pos', '/kitchen', '/admin', '/saas'],
    CASHIER: ['/', '/customer', '/pos'],
    WAITER: ['/', '/customer', '/pos'],
    KITCHEN: ['/', '/kitchen'],
};

export function navItemsForRole(role?: string | null): NavItem[] {
    if (!role) {
        return ALL_NAV.filter((item) => item.path === '/' || item.path === '/customer');
    }
    const allowed = ROLE_PATHS[role] ?? ['/', '/pos'];
    return ALL_NAV.filter((item) => allowed.includes(item.path));
}

export function canAccessPath(role: string | null | undefined, path: string): boolean {
    if (!role) return path === '/' || path === '/customer' || path === '/login';
    const allowed = ROLE_PATHS[role] ?? ['/', '/pos'];
    if (path === '/login') return true;
    return allowed.some((entry) => path === entry || path.startsWith(`${entry}/`));
}

export function redirectPathForUnauthorized(role: string): string {
    return homePathForRole(role);
}
