import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderItemStatus, OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { lockOrder } from '../orders/order-lock';
import {
    assertKitchenItemTransition,
    deriveOrderStatusFromItems,
    kitchenStageAdvance,
} from '../orders/order-item-status';
import { OrdersGateway } from '../realtime/orders.gateway';

@Injectable()
export class KitchenService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly ordersGateway: OrdersGateway,
    ) {}

    async getTickets(tenantId: string, branchId?: string) {
        const where: {
            tenantId: string;
            status: { in: OrderStatus[] };
            branchId?: string;
        } = {
            tenantId,
            status: { in: ['CONFIRMED', 'PREPARING', 'READY', 'SERVED'] },
        };

        if (branchId) {
            where.branchId = branchId;
        }

        const orders = await this.prisma.order.findMany({
            where,
            include: {
                items: true,
                table: { select: { id: true, name: true, code: true } },
            },
            orderBy: { createdAt: 'asc' },
        });

        // Kitchen board ignores cancelled lines; they remain for POS/audit.
        return orders.map((order) => ({
            ...order,
            items: order.items.filter((item) => item.status !== 'CANCELLED'),
        }));
    }

    async updateItemStatus(
        tenantId: string,
        orderId: string,
        itemId: string,
        status: string,
    ) {
        const next = status as OrderItemStatus;
        const updated = await this.prisma.$transaction(async (tx) => {
            await lockOrder(tx, tenantId, orderId);
            const order = await tx.order.findFirst({
                where: { id: orderId, tenantId },
                include: { items: true },
            });
            if (!order) throw new NotFoundException('Order not found');
            if (order.status === 'CANCELLED' || order.status === 'COMPLETED') {
                throw new ConflictException(`Order ${order.status} is not on the kitchen board`);
            }

            const item = order.items.find((entry) => entry.id === itemId);
            if (!item) throw new NotFoundException('Order item not found');
            if (!assertKitchenItemTransition(item.status, next)) {
                throw new BadRequestException(
                    `Invalid item transition: ${item.status} → ${next}. Allowed: PENDING→PREPARING→READY→SERVED`,
                );
            }

            const changed = await tx.orderItem.updateMany({
                where: { id: itemId, orderId, status: item.status },
                data: { status: next },
            });
            if (changed.count !== 1) {
                throw new ConflictException(`Invalid item transition: ${item.status} → ${next}`);
            }

            const allItems = await tx.orderItem.findMany({ where: { orderId } });
            const orderStatus = deriveOrderStatusFromItems(allItems, order.status);
            if (orderStatus !== order.status) {
                const written = await tx.order.updateMany({
                    where: {
                        id: orderId,
                        tenantId,
                        status: { notIn: ['CANCELLED', 'COMPLETED'] },
                    },
                    data: { status: orderStatus },
                });
                if (written.count !== 1) {
                    throw new ConflictException(`Order ${order.status} is not on the kitchen board`);
                }
            }

            return {
                item: await tx.orderItem.findUniqueOrThrow({ where: { id: itemId } }),
                orderStatus,
                branchId: order.branchId,
                tableId: order.tableId,
            };
        });

        this.ordersGateway.emitOrderChanged(tenantId, {
            reason: 'status',
            orderId,
            status: updated.orderStatus,
            branchId: updated.branchId,
            tableId: updated.tableId,
        });

        return updated.item;
    }

    /**
     * Board button advances only items in the current stage.
     * Existing further-along items are never reset.
     * Order status is then re-derived from all active items (gọi thêm PENDING → CONFIRMED).
     */
    async updateOrderStatus(tenantId: string, orderId: string, status: string) {
        const requested = status as OrderStatus;
        const advance = kitchenStageAdvance(requested);
        if (!advance) {
            throw new BadRequestException(
                `Invalid kitchen target status: ${requested}. Allowed: PREPARING, READY, SERVED`,
            );
        }

        const updated = await this.prisma.$transaction(async (tx) => {
            await lockOrder(tx, tenantId, orderId);
            const order = await tx.order.findFirst({
                where: { id: orderId, tenantId },
                include: { items: true, table: { select: { id: true, name: true, code: true } } },
            });
            if (!order) throw new NotFoundException('Order not found');

            if (order.status === 'CANCELLED' || order.status === 'COMPLETED') {
                throw new ConflictException(`Order ${order.status} is not on the kitchen board`);
            }
            if (order.status === 'PENDING' || order.status === 'DRAFT') {
                throw new BadRequestException(`Order ${order.status} is not on the kitchen board`);
            }

            const stageItems = order.items.filter((item) => item.status === advance.fromItem);
            if (!stageItems.length) {
                throw new BadRequestException(
                    `No ${advance.fromItem} items to move to ${advance.toItem}`,
                );
            }

            const changed = await tx.orderItem.updateMany({
                where: { orderId, status: advance.fromItem },
                data: { status: advance.toItem },
            });
            if (changed.count < 1) {
                throw new ConflictException(
                    `No ${advance.fromItem} items to move to ${advance.toItem}`,
                );
            }

            const allItems = await tx.orderItem.findMany({ where: { orderId } });
            const nextStatus = deriveOrderStatusFromItems(allItems, requested);
            const written = await tx.order.updateMany({
                where: {
                    id: orderId,
                    tenantId,
                    status: { notIn: ['CANCELLED', 'COMPLETED'] },
                },
                data: { status: nextStatus },
            });
            if (written.count !== 1) {
                throw new ConflictException(`Order ${order.status} is not on the kitchen board`);
            }

            return tx.order.findFirstOrThrow({
                where: { id: orderId, tenantId },
                include: {
                    items: true,
                    table: { select: { id: true, name: true, code: true } },
                },
            });
        });

        this.ordersGateway.emitOrderChanged(tenantId, {
            reason: 'status',
            orderId: updated.id,
            status: updated.status,
            branchId: updated.branchId,
            tableId: updated.tableId,
        });

        return {
            ...updated,
            items: updated.items.filter((item) => item.status !== 'CANCELLED'),
        };
    }
}
