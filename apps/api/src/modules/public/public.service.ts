import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class PublicService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly ordersService: OrdersService,
    ) {}

    async getTableByToken(token: string) {
        const table = await this.prisma.table.findUnique({
            where: { qrToken: token },
            include: {
                branch: true,
            },
        });

        if (!table) {
            throw new NotFoundException('Table not found');
        }

        return table;
    }

    async getMenuByTableToken(token: string) {
        const table = await this.getTableByToken(token);
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: table.tenantId },
            select: { name: true },
        });

        if (!tenant) {
            throw new NotFoundException('Restaurant not found');
        }

        const categories = await this.prisma.category.findMany({
            where: {
                tenantId: table.tenantId,
                isActive: true,
            },
            orderBy: { sortOrder: 'asc' },
            include: {
                products: {
                    where: { isActive: true },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        return {
            table: { ...table, tenant },
            categories,
        };
    }

    async createOrderFromTable(
        token: string,
        payload: { items: Array<{ productId: string; quantity: number; note?: string }> },
    ) {
        const table = await this.getTableByToken(token);

        if (!payload.items || payload.items.length === 0) {
            throw new Error('Order must contain at least one item');
        }

        // One open bill per table — create() appends when a session order already exists.
        return this.ordersService.create(table.tenantId, {
            branchId: table.branchId,
            tableId: table.id,
            note: 'Created from QR table ordering',
            items: payload.items,
        });
    }
}
