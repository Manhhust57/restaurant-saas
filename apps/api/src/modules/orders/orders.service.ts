import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrdersService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(tenantId: string) {
        return this.prisma.order.findMany({
            where: { tenantId },
            include: { items: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(tenantId: string, payload: { branchId: string; tableId?: string; note?: string }) {
        const orderNumber = `ORD-${Date.now()}`;

        return this.prisma.order.create({
            data: {
                tenantId,
                branchId: payload.branchId,
                tableId: payload.tableId ?? null,
                orderNumber,
                subtotal: 0,
                discount: 0,
                total: 0,
                note: payload.note ?? null,
                status: 'PENDING',
            },
            include: { items: true },
        });
    }

    async confirm(tenantId: string, orderId: string) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, tenantId },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return this.prisma.order.update({
            where: { id: orderId },
            data: { status: 'CONFIRMED' },
        });
    }
}
