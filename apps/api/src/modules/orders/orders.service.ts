import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { OrderItemStatus, OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersGateway } from '../realtime/orders.gateway';
import { lockOrder } from './order-lock';
import {
    canCancelOrderItem,
    canEditOrderItem,
    deriveOrderStatusFromItems,
    isOrderOpenForItems,
} from './order-item-status';

type OrderItemInput = { productId: string; quantity: number; note?: string };

const orderView = {
    items: true,
    table: { select: { id: true, name: true, code: true } },
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrdersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly ordersGateway: OrdersGateway,
    ) {}

    async findAll(tenantId: string) {
        return this.prisma.order.findMany({
            where: { tenantId },
            include: { items: true, table: { select: { id: true, name: true, code: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(tenantId: string, orderId: string) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, tenantId },
            include: {
                items: true,
                table: { select: { id: true, name: true, code: true } },
                payments: { where: { status: 'PAID' }, select: { id: true } },
            },
        });
        if (!order) throw new NotFoundException('Order not found');
        return order;
    }

    /**
     * One open order per table: earliest non-COMPLETED/CANCELLED order.
     * If legacy duplicates exist, merge their items into the session bill and cancel the extras.
     */
    async findOpenOrderForTable(tenantId: string, tableId: string) {
        const opens = await this.prisma.order.findMany({
            where: {
                tenantId,
                tableId,
                status: { notIn: ['COMPLETED', 'CANCELLED'] },
            },
            include: {
                items: true,
                table: { select: { id: true, name: true, code: true } },
                payments: { where: { status: 'PAID' }, select: { id: true } },
            },
            orderBy: { createdAt: 'asc' },
        });

        if (!opens.length) return null;
        if (opens.length === 1) return opens[0];

        const session = opens[0];
        const extras = opens.slice(1);

        await this.prisma.$transaction(async (tx) => {
            for (const extra of extras) {
                if (extra.payments.length) {
                    // Paid duplicate should not happen on an "open" query; skip merge.
                    continue;
                }
                await tx.orderItem.updateMany({
                    where: { orderId: extra.id },
                    data: { orderId: session.id },
                });
                await tx.order.update({
                    where: { id: extra.id },
                    data: { status: 'CANCELLED', subtotal: 0, total: 0 },
                });
            }

            const allItems = await tx.orderItem.findMany({ where: { orderId: session.id } });
            const { subtotal, total } = this.totalsFromItems(allItems, session.discount);
            const nextStatus = this.nextOpenOrderStatus(session.status, allItems);
            await tx.order.update({
                where: { id: session.id },
                data: { subtotal, total, status: nextStatus },
            });
        });

        this.emit(tenantId, {
            reason: 'items_added',
            orderId: session.id,
            status: session.status,
            branchId: session.branchId,
            tableId: session.tableId,
        });

        return this.findOne(tenantId, session.id);
    }

    async create(
        tenantId: string,
        payload: {
            branchId: string;
            tableId?: string;
            note?: string;
            items: OrderItemInput[];
        },
    ) {
        if (!payload.items?.length) {
            throw new BadRequestException('Order must contain at least one item');
        }

        const branch = await this.prisma.branch.findFirst({ where: { id: payload.branchId, tenantId } });
        if (!branch) throw new NotFoundException('Branch not found');

        if (payload.tableId) {
            const table = await this.prisma.table.findFirst({
                where: { id: payload.tableId, tenantId, branchId: payload.branchId },
            });
            if (!table) throw new NotFoundException('Table not found');
            // Collapse legacy duplicate open bills before the table lock below.
            await this.findOpenOrderForTable(tenantId, payload.tableId);
        }

        const outcome = await this.prisma.$transaction(async (tx) => {
            if (payload.tableId) {
                const locked = await tx.$queryRaw<Array<{ id: string }>>`
                    SELECT id FROM "Table"
                    WHERE id = ${payload.tableId} AND "tenantId" = ${tenantId}
                    FOR UPDATE
                `;
                if (!locked.length) throw new NotFoundException('Table not found');

                const existing = await tx.order.findFirst({
                    where: {
                        tenantId,
                        tableId: payload.tableId,
                        status: { notIn: ['COMPLETED', 'CANCELLED'] },
                    },
                    include: {
                        items: true,
                        payments: { where: { status: 'PAID' }, select: { id: true } },
                    },
                    orderBy: { createdAt: 'asc' },
                });

                if (existing) {
                    const lockedOrder = await this.lockMutableOrder(tx, tenantId, existing.id);
                    const order = await this.appendItemsInTx(tx, tenantId, lockedOrder, payload.items);
                    return { reason: 'items_added' as const, order };
                }
            }

            const orderItemsData = await this.buildItemRows(tenantId, payload.items, tx);
            const subtotal = this.sumItemTotals(orderItemsData);
            const orderNumber = `ORD-${Date.now()}`;

            const order = await tx.order.create({
                data: {
                    tenantId,
                    branchId: payload.branchId,
                    tableId: payload.tableId ?? null,
                    orderNumber,
                    subtotal,
                    discount: 0,
                    total: subtotal,
                    note: payload.note ?? null,
                    status: 'PENDING',
                    items: {
                        create: orderItemsData.map((item) => ({
                            productId: item.productId,
                            productName: item.productName,
                            unitPrice: item.unitPrice,
                            quantity: item.quantity,
                            total: item.total,
                            note: item.note,
                            status: 'PENDING',
                        })),
                    },
                },
                include: orderView,
            });

            return { reason: 'created' as const, order };
        });

        this.emit(tenantId, {
            reason: outcome.reason,
            orderId: outcome.order.id,
            status: outcome.order.status,
            branchId: outcome.order.branchId,
            tableId: outcome.order.tableId,
        });

        return outcome.order;
    }

    async confirm(tenantId: string, orderId: string) {
        const updated = await this.prisma.$transaction(async (tx) => {
            const changed = await tx.order.updateMany({
                where: { id: orderId, tenantId, status: 'PENDING' },
                data: { status: 'CONFIRMED' },
            });

            if (changed.count !== 1) {
                const order = await tx.order.findFirst({
                    where: { id: orderId, tenantId },
                    select: { status: true },
                });
                if (!order) throw new NotFoundException('Order not found');
                throw new ConflictException(`Only PENDING orders can be confirmed (current: ${order.status})`);
            }

            return tx.order.findFirstOrThrow({
                where: { id: orderId, tenantId },
                include: orderView,
            });
        });

        this.emit(tenantId, {
            reason: 'confirmed',
            orderId: updated.id,
            status: updated.status,
            branchId: updated.branchId,
            tableId: updated.tableId,
        });

        return updated;
    }

    /**
     * Append items to an existing open order.
     * Does not create a new order. Does not change status of existing items.
     * Order board status is re-derived from items (new PENDING → CONFIRMED on kitchen board)
     * without resetting PREPARING/READY/SERVED lines.
     */
    async addItems(tenantId: string, orderId: string, items: OrderItemInput[]) {
        if (!items?.length) {
            throw new BadRequestException('Must provide at least one item');
        }

        const updated = await this.prisma.$transaction(async (tx) => {
            const order = await this.lockMutableOrder(tx, tenantId, orderId);
            return this.appendItemsInTx(tx, tenantId, order, items);
        });

        this.emit(tenantId, {
            reason: 'items_added',
            orderId: updated.id,
            status: updated.status,
            branchId: updated.branchId,
            tableId: updated.tableId,
        });

        return updated;
    }

    /** Change quantity (and optional note) on a PENDING item only. */
    async updateItem(
        tenantId: string,
        orderId: string,
        itemId: string,
        payload: { quantity: number; note?: string },
    ) {
        const quantity = Number(payload.quantity);
        if (!Number.isInteger(quantity) || quantity < 1) {
            throw new BadRequestException('Quantity must be an integer >= 1');
        }

        const updated = await this.prisma.$transaction(async (tx) => {
            const order = await this.lockMutableOrder(tx, tenantId, orderId);
            const item = order.items.find((entry) => entry.id === itemId);
            if (!item) throw new NotFoundException('Order item not found');
            if (!canEditOrderItem(item.status)) {
                throw new ConflictException(
                    `Only PENDING items can be edited (current: ${item.status})`,
                );
            }

            const lineTotal = new Prisma.Decimal(item.unitPrice).mul(quantity);
            const changed = await tx.orderItem.updateMany({
                where: { id: itemId, orderId, status: 'PENDING' },
                data: {
                    quantity,
                    total: lineTotal,
                    ...(payload.note !== undefined ? { note: payload.note } : {}),
                },
            });
            if (changed.count !== 1) {
                throw new ConflictException(
                    `Only PENDING items can be edited (current: ${item.status})`,
                );
            }

            const allItems = await tx.orderItem.findMany({ where: { orderId } });
            const { subtotal, total } = this.totalsFromItems(allItems, order.discount);
            const nextStatus = this.nextOpenOrderStatus(order.status, allItems);
            return this.saveOpenOrder(tx, tenantId, orderId, order.status, { subtotal, total, status: nextStatus });
        });

        this.emit(tenantId, {
            reason: 'item_updated',
            orderId: updated.id,
            status: updated.status,
            branchId: updated.branchId,
            tableId: updated.tableId,
        });

        return updated;
    }

    /** Soft-cancel: PENDING → CANCELLED. Never hard-deletes the row. */
    async cancelItem(tenantId: string, orderId: string, itemId: string) {
        const updated = await this.prisma.$transaction(async (tx) => {
            const order = await this.lockMutableOrder(tx, tenantId, orderId);
            const item = order.items.find((entry) => entry.id === itemId);
            if (!item) throw new NotFoundException('Order item not found');
            if (!canCancelOrderItem(item.status)) {
                throw new ConflictException(
                    `Only PENDING items can be cancelled (current: ${item.status})`,
                );
            }

            const activeCount = order.items.filter((entry) => entry.status !== 'CANCELLED').length;
            if (activeCount <= 1) {
                throw new ConflictException(
                    'Cannot cancel the last active item; cancel the order instead',
                );
            }

            const changed = await tx.orderItem.updateMany({
                where: { id: itemId, orderId, status: 'PENDING' },
                data: { status: 'CANCELLED' },
            });
            if (changed.count !== 1) {
                throw new ConflictException(
                    `Only PENDING items can be cancelled (current: ${item.status})`,
                );
            }

            const allItems = await tx.orderItem.findMany({ where: { orderId } });
            const { subtotal, total } = this.totalsFromItems(allItems, order.discount);
            const nextStatus = this.nextOpenOrderStatus(order.status, allItems);
            return this.saveOpenOrder(tx, tenantId, orderId, order.status, { subtotal, total, status: nextStatus });
        });

        this.emit(tenantId, {
            reason: 'item_cancelled',
            orderId: updated.id,
            status: updated.status,
            branchId: updated.branchId,
            tableId: updated.tableId,
        });

        return updated;
    }

    /**
     * Cancel order when:
     * - no PAID payment
     * - no item in PREPARING / READY / SERVED
     * Soft-cancels remaining PENDING items, then sets order CANCELLED.
     */
    async cancelOrder(tenantId: string, orderId: string) {
        const updated = await this.prisma.$transaction(async (tx) => {
            await lockOrder(tx, tenantId, orderId);
            const order = await tx.order.findFirst({
                where: { id: orderId, tenantId },
                include: {
                    items: true,
                    payments: { where: { status: 'PAID' }, select: { id: true } },
                },
            });
            if (!order) throw new NotFoundException('Order not found');
            if (order.status === 'CANCELLED') {
                throw new ConflictException('Order is already cancelled');
            }
            if (order.status === 'COMPLETED') {
                throw new ConflictException('Completed orders cannot be cancelled');
            }
            if (order.payments.length > 0) {
                throw new ConflictException('Paid orders cannot be cancelled');
            }

            const started = order.items.filter((item) =>
                (['PREPARING', 'READY', 'SERVED'] as OrderItemStatus[]).includes(item.status),
            );
            if (started.length) {
                throw new ConflictException(
                    'Cannot cancel order while items are PREPARING, READY, or SERVED',
                );
            }

            await tx.orderItem.updateMany({
                where: { orderId, status: 'PENDING' },
                data: { status: 'CANCELLED' },
            });

            return this.saveOpenOrder(tx, tenantId, orderId, order.status, {
                subtotal: new Prisma.Decimal(0),
                total: new Prisma.Decimal(0),
                status: 'CANCELLED',
            });
        });

        this.emit(tenantId, {
            reason: 'cancelled',
            orderId: updated.id,
            status: updated.status,
            branchId: updated.branchId,
            tableId: updated.tableId,
        });

        return updated;
    }

    /** Lock the order, then reject closed or already-paid bills. */
    private async lockMutableOrder(tx: Prisma.TransactionClient, tenantId: string, orderId: string) {
        await lockOrder(tx, tenantId, orderId);
        const order = await tx.order.findFirst({
            where: { id: orderId, tenantId },
            include: {
                items: true,
                payments: { where: { status: 'PAID' }, select: { id: true } },
            },
        });
        if (!order) throw new NotFoundException('Order not found');
        if (!isOrderOpenForItems(order.status)) {
            throw new ConflictException(`Cannot modify items on ${order.status} orders`);
        }
        if (order.payments.length > 0) {
            throw new ConflictException('Cannot modify items on a paid order');
        }
        return order;
    }

    private async saveOpenOrder(
        tx: Prisma.TransactionClient,
        tenantId: string,
        orderId: string,
        currentStatus: OrderStatus,
        data: { subtotal: Prisma.Decimal; total: Prisma.Decimal; status?: OrderStatus },
    ) {
        const written = await tx.order.updateMany({
            where: {
                id: orderId,
                tenantId,
                status: { notIn: ['CANCELLED', 'COMPLETED'] },
            },
            data: {
                subtotal: data.subtotal,
                total: data.total,
                ...(data.status && data.status !== currentStatus ? { status: data.status } : {}),
            },
        });
        if (written.count !== 1) {
            throw new ConflictException('Cannot modify items on a closed order');
        }
        return tx.order.findFirstOrThrow({
            where: { id: orderId, tenantId },
            include: orderView,
        });
    }

    /**
     * Unconfirmed orders stay PENDING until POS confirms.
     * After confirm, board column follows earliest active item work.
     */
    private nextOpenOrderStatus(
        current: OrderStatus,
        items: Array<{ status: OrderItemStatus }>,
    ): OrderStatus {
        if (current === 'PENDING' || current === 'DRAFT') return current;
        return deriveOrderStatusFromItems(items, current);
    }

    /** Insert lines and recompute totals. Caller owns the transaction. */
    private async appendItemsInTx(
        tx: Prisma.TransactionClient,
        tenantId: string,
        order: {
            id: string;
            status: OrderStatus;
            discount: Prisma.Decimal;
            items: Array<{ status: OrderItemStatus }>;
        },
        items: OrderItemInput[],
    ) {
        const orderItemsData = await this.buildItemRows(tenantId, items, tx);
        // After kitchen has started (Nhận đơn+), later appends are "gọi thêm".
        const isExtra = order.items.some((item) =>
            ['PREPARING', 'READY', 'SERVED'].includes(item.status),
        ) || ['PREPARING', 'READY', 'SERVED'].includes(order.status);

        await tx.orderItem.createMany({
            data: orderItemsData.map((item) => ({
                orderId: order.id,
                productId: item.productId,
                productName: item.productName,
                unitPrice: item.unitPrice,
                quantity: item.quantity,
                total: item.total,
                note: item.note,
                status: 'PENDING' as const,
                isExtra,
            })),
        });

        const allItems = await tx.orderItem.findMany({ where: { orderId: order.id } });
        const { subtotal, total } = this.totalsFromItems(allItems, order.discount);
        const nextStatus = this.nextOpenOrderStatus(order.status, allItems);
        return this.saveOpenOrder(tx, tenantId, order.id, order.status, { subtotal, total, status: nextStatus });
    }

    private async buildItemRows(
        tenantId: string,
        items: OrderItemInput[],
        db: Prisma.TransactionClient | PrismaService = this.prisma,
    ) {
        const products = await db.product.findMany({
            where: {
                tenantId,
                id: { in: items.map((item) => item.productId) },
                isActive: true,
            },
        });
        const productMap = new Map(products.map((product) => [product.id, product]));

        return items.map((item) => {
            const product = productMap.get(item.productId);
            if (!product) {
                throw new NotFoundException(`Product ${item.productId} not found`);
            }

            const quantity = Number(item.quantity);
            if (!Number.isInteger(quantity) || quantity < 1) {
                throw new BadRequestException('Quantity must be an integer >= 1');
            }

            const unitPrice = new Prisma.Decimal(product.price);
            const total = unitPrice.mul(quantity);

            return {
                productId: product.id,
                productName: product.name,
                unitPrice,
                quantity,
                total,
                note: item.note ?? null,
            };
        });
    }

    private sumItemTotals(
        items: Array<{ total: Prisma.Decimal }>,
    ): Prisma.Decimal {
        return items.reduce((sum, item) => sum.add(item.total), new Prisma.Decimal(0));
    }

    private totalsFromItems(
        items: Array<{ status: OrderItemStatus; total: Prisma.Decimal }>,
        discount: Prisma.Decimal | number,
    ) {
        const active = items.filter((item) => item.status !== 'CANCELLED');
        const subtotal = this.sumItemTotals(active);
        const discountDecimal = new Prisma.Decimal(discount);
        const total = Prisma.Decimal.max(subtotal.sub(discountDecimal), new Prisma.Decimal(0));
        return { subtotal, total };
    }

    private emit(
        tenantId: string,
        payload: {
            reason:
                | 'created'
                | 'confirmed'
                | 'status'
                | 'paid'
                | 'items_added'
                | 'item_updated'
                | 'item_cancelled'
                | 'cancelled';
            orderId: string;
            status: string;
            branchId?: string | null;
            tableId?: string | null;
        },
    ) {
        this.ordersGateway.emitOrderChanged(tenantId, payload);
    }
}
