import type { OrderItemLine, PosOrder } from '../types/order';

const LOCKED_ITEM = new Set(['PREPARING', 'READY', 'SERVED', 'CANCELLED']);
const KITCHEN_STARTED = new Set(['PREPARING', 'READY', 'SERVED']);
const CLOSED_ORDER = new Set(['CANCELLED', 'COMPLETED']);

export function isPendingItem(status: string) {
    return status === 'PENDING';
}

export function isItemEditable(status: string) {
    return status === 'PENDING';
}

export function isOrderClosed(status: string) {
    return CLOSED_ORDER.has(status);
}

export function isOrderOpen(status: string) {
    return !isOrderClosed(status);
}

/** Order can receive gọi thêm (backend also enforces PAID/CANCELLED/COMPLETED). */
export function canAppendItems(order: PosOrder | null | undefined) {
    if (!order) return false;
    return isOrderOpen(order.status);
}

export function activeItems(items: OrderItemLine[]) {
    return items.filter((item) => item.status !== 'CANCELLED');
}

export function cancelledItems(items: OrderItemLine[]) {
    return items.filter((item) => item.status === 'CANCELLED');
}

/** Totals: only non-CANCELLED lines. */
export function sumActiveItemTotals(items: OrderItemLine[]) {
    return activeItems(items).reduce((sum, item) => sum + Number(item.total ?? 0), 0);
}

export function sumActiveItemQty(items: OrderItemLine[]) {
    return activeItems(items).reduce((sum, item) => sum + item.quantity, 0);
}

/** Soft-cancel item only when PENDING and not the last active line. */
export function canCancelPendingItem(items: OrderItemLine[], itemId: string) {
    const item = items.find((entry) => entry.id === itemId);
    if (!item || !isPendingItem(item.status)) return false;
    return activeItems(items).length > 1;
}

/**
 * Cancel order FE guard (backend re-checks):
 * not PAID/COMPLETED, no PREPARING/READY/SERVED items.
 */
export function canCancelOpenOrder(order: PosOrder | null | undefined) {
    if (!order) return false;
    if (isOrderClosed(order.status)) return false;
    if (order.items.some((item) => KITCHEN_STARTED.has(item.status))) return false;
    return true;
}

/** Confirm only PENDING → CONFIRMED. */
export function canConfirmOrder(status: string) {
    return status === 'PENDING';
}

export function itemStatusLabel(status: string) {
    if (status === 'PENDING') return 'Chờ';
    if (status === 'PREPARING') return 'Đang làm';
    if (status === 'READY') return 'Sẵn sàng';
    if (status === 'SERVED') return 'Đã lấy';
    if (status === 'CANCELLED') return 'Đã hủy';
    return status;
}

export function kitchenItemStatusLabel(status: string) {
    if (status === 'PENDING') return 'mới';
    if (status === 'PREPARING') return 'đang làm';
    if (status === 'READY') return 'xong';
    if (status === 'SERVED') return 'đã lấy';
    return status.toLowerCase();
}

/** Items kitchen may advance for a board button target. */
export function kitchenStageSourceStatus(nextStatus: string): string | null {
    if (nextStatus === 'PREPARING') return 'PENDING';
    if (nextStatus === 'READY') return 'PREPARING';
    if (nextStatus === 'SERVED') return 'READY';
    return null;
}

export function kitchenVisibleItems(items: OrderItemLine[]) {
    return items.filter((item) => item.status !== 'CANCELLED');
}

/** Items fired after kitchen already started — show as "Gọi thêm". */
export function isKitchenExtraItem(item: OrderItemLine) {
    return Boolean(item.isExtra);
}

export function kitchenExtraItems(items: OrderItemLine[]) {
    return kitchenVisibleItems(items).filter((item) => isKitchenExtraItem(item));
}

export function kitchenOriginalItems(items: OrderItemLine[]) {
    return kitchenVisibleItems(items).filter((item) => !isKitchenExtraItem(item));
}

export function kitchenHasStageWork(items: OrderItemLine[], nextStatus: string) {
    const from = kitchenStageSourceStatus(nextStatus);
    if (!from) return false;
    return kitchenVisibleItems(items).some((item) => item.status === from);
}

export function isLockedItemStatus(status: string) {
    return LOCKED_ITEM.has(status);
}

/**
 * One session bill per table: the earliest still-open order.
 * Later rounds of "gọi món" must append to this order.
 */
export function pickSessionOrder(orders: PosOrder[]): PosOrder | null {
    const open = orders.filter((order) => isOrderOpen(order.status));
    if (!open.length) return null;
    return [...open].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )[0];
}
