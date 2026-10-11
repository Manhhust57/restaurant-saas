const storageKey = (token: string) => `restaurant_cart:${token}`;

export function loadCart(token: string): Record<string, number> {
    try {
        const raw = localStorage.getItem(storageKey(token));
        if (!raw) return {};
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
        return Object.fromEntries(
            Object.entries(parsed).filter(
                (entry): entry is [string, number] => typeof entry[0] === 'string' && Number.isFinite(entry[1]) && Number(entry[1]) > 0,
            ).map(([productId, quantity]) => [productId, Math.floor(Number(quantity))]),
        );
    } catch {
        return {};
    }
}

export function saveCart(token: string, cart: Record<string, number>) {
    const entries = Object.entries(cart).filter(([, quantity]) => quantity > 0);
    if (!entries.length) {
        localStorage.removeItem(storageKey(token));
        return;
    }
    localStorage.setItem(storageKey(token), JSON.stringify(Object.fromEntries(entries)));
}

export function clearCart(token: string) {
    localStorage.removeItem(storageKey(token));
}
