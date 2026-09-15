import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class KitchenService {
    constructor(private readonly prisma: PrismaService) { }

    async getTickets(tenantId: string, branchId?: string) {
        const where: any = {
            tenantId,
            status: { in: ['CONFIRMED', 'PREPARING', 'READY', 'SERVED'] },
        };

        if (branchId) {
            where.branchId = branchId;
        }

        return this.prisma.order.findMany({
            where,
            include: {
                items: true,
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async updateItemStatus(tenantId: string, orderId: string, itemId: string, status: string) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, tenantId },
            include: { items: true },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        const item = order.items.find((entry) => entry.id === itemId);
        if (!item) {
            throw new NotFoundException('Order item not found');
        }

        const updatedItem = await this.prisma.orderItem.update({
            where: { id: itemId },
            data: { status: status as any },
        });

        return updatedItem;
    }

    async updateOrderStatus(tenantId: string, orderId: string, status: string) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, tenantId },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return this.prisma.order.update({
            where: { id: orderId },
            data: { status: status as any },
        });
    }
}
