/**
 * Run from apps/api:
 *   npx ts-node --transpile-only src/modules/orders/order-item-status.selftest.ts
 */
import {
    assertKitchenItemTransition,
    canCancelOrderItem,
    canEditOrderItem,
    deriveOrderStatusFromItems,
    isOrderOpenForItems,
    kitchenStageAdvance,
} from './order-item-status';

function assert(cond: boolean, message: string) {
    if (!cond) throw new Error(message);
}

assert(canEditOrderItem('PENDING'), 'PENDING editable');
assert(!canEditOrderItem('PREPARING'), 'PREPARING locked');
assert(!canEditOrderItem('READY'), 'READY locked');
assert(!canEditOrderItem('SERVED'), 'SERVED locked');
assert(!canEditOrderItem('CANCELLED'), 'CANCELLED locked');

assert(canCancelOrderItem('PENDING'), 'PENDING cancellable');
assert(!canCancelOrderItem('PREPARING'), 'PREPARING not cancellable');

assert(assertKitchenItemTransition('PENDING', 'PREPARING'), 'PENDING→PREPARING');
assert(assertKitchenItemTransition('PREPARING', 'READY'), 'PREPARING→READY');
assert(assertKitchenItemTransition('READY', 'SERVED'), 'READY→SERVED');
assert(!assertKitchenItemTransition('PENDING', 'READY'), 'no skip PENDING→READY');
assert(!assertKitchenItemTransition('PENDING', 'CANCELLED'), 'kitchen cannot cancel');
assert(!assertKitchenItemTransition('SERVED', 'READY'), 'no reverse');

assert(kitchenStageAdvance('PREPARING')?.fromItem === 'PENDING', 'stage PREPARING from PENDING');
assert(kitchenStageAdvance('READY')?.fromItem === 'PREPARING', 'stage READY from PREPARING');
assert(kitchenStageAdvance('SERVED')?.fromItem === 'READY', 'stage SERVED from READY');
assert(kitchenStageAdvance('CONFIRMED') === null, 'CONFIRMED is not a kitchen advance target');

assert(isOrderOpenForItems('CONFIRMED'), 'CONFIRMED open');
assert(!isOrderOpenForItems('COMPLETED'), 'COMPLETED closed');
assert(!isOrderOpenForItems('CANCELLED'), 'CANCELLED closed');

assert(
    deriveOrderStatusFromItems([{ status: 'READY' }, { status: 'PENDING' }]) === 'CONFIRMED',
    'gọi thêm PENDING wins over READY',
);
assert(
    deriveOrderStatusFromItems([{ status: 'READY' }, { status: 'PREPARING' }]) === 'PREPARING',
    'PREPARING wins over READY',
);
assert(
    deriveOrderStatusFromItems([{ status: 'READY' }, { status: 'SERVED' }]) === 'READY',
    'READY wins over SERVED',
);
assert(
    deriveOrderStatusFromItems([{ status: 'SERVED' }, { status: 'CANCELLED' }]) === 'SERVED',
    'ignore CANCELLED',
);
assert(
    deriveOrderStatusFromItems([{ status: 'CANCELLED' }]) === 'CANCELLED',
    'all cancelled',
);

console.log('order-item-status selftest: ok');
