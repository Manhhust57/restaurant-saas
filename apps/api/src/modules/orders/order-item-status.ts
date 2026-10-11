import { OrderItemStatus, OrderStatus } from '@prisma/client';

/** Kitchen / cook path only. POS cancel is separate (PENDING → CANCELLED). */
const KITCHEN_ITEM_TRANSITIONS: Record<OrderItemStatus, OrderItemStatus[]> = {
    PENDING: ['PREPARING'],
    PREPARING: ['READY'],
    READY: ['SERVED'],
    SERVED: [],
    CANCELLED: [],
};

/**
 * Kitchen board button advances items in the current stage only:
 * - Nhận đơn (→ PREPARING): PENDING → PREPARING
 * - Hoàn tất (→ READY): PREPARING → READY
 * - Đã lấy (→ SERVED): READY → SERVED
 * Never touches CANCELLED / already-further items.
 */
const KITCHEN_STAGE_ADVANCE: Partial<
    Record<OrderStatus, { fromItem: OrderItemStatus; toItem: OrderItemStatus }>
> = {
    PREPARING: { fromItem: 'PENDING', toItem: 'PREPARING' },
    READY: { fromItem: 'PREPARING', toItem: 'READY' },
    SERVED: { fromItem: 'READY', toItem: 'SERVED' },
};

/** Item statuses that mean kitchen has started (or finished) work — not editable from POS. */
export const LOCKED_ORDER_ITEM_STATUSES: OrderItemStatus[] = [
    'PREPARING',
    'READY',
    'SERVED',
    'CANCELLED',
];

export function canEditOrderItem(status: OrderItemStatus): boolean {
    return status === 'PENDING';
}

export function canCancelOrderItem(status: OrderItemStatus): boolean {
    return status === 'PENDING';
}

export function assertKitchenItemTransition(from: OrderItemStatus, to: OrderItemStatus): boolean {
    return KITCHEN_ITEM_TRANSITIONS[from]?.includes(to) ?? false;
}

export function kitchenStageAdvance(nextOrderStatus: OrderStatus) {
    return KITCHEN_STAGE_ADVANCE[nextOrderStatus] ?? null;
}

export function isOrderOpenForItems(status: OrderStatus): boolean {
    return !['CANCELLED', 'COMPLETED'].includes(status);
}

/**
 * Order board column is derived from active (non-cancelled) items.
 * Earliest unfinished work wins — so gọi thêm (new PENDING) surfaces as CONFIRMED
 * without resetting PREPARING/READY/SERVED lines.
 */
export function deriveOrderStatusFromItems(
    items: Array<{ status: OrderItemStatus }>,
    fallback: OrderStatus = 'CONFIRMED',
): OrderStatus {
    const active = items.filter((item) => item.status !== 'CANCELLED');
    if (!active.length) return 'CANCELLED';

    if (active.some((item) => item.status === 'PENDING')) return 'CONFIRMED';
    if (active.some((item) => item.status === 'PREPARING')) return 'PREPARING';
    if (active.some((item) => item.status === 'READY')) return 'READY';
    if (active.every((item) => item.status === 'SERVED')) return 'SERVED';

    return fallback;
}
