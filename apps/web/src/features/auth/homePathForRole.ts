const ROLE_HOME: Record<string, string> = {
    OWNER: '/admin',
    MANAGER: '/admin',
    CASHIER: '/pos',
    WAITER: '/pos',
    KITCHEN: '/kitchen',
};

export function homePathForRole(role: string): string {
    return ROLE_HOME[role] ?? '/pos';
}
