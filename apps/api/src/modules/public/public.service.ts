import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PublicService {
    constructor(private readonly prisma: PrismaService) { }

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
            table,
            categories,
        };
    }

    async createOrderFromTable(token: string, payload: { items: Array<{ productId: string; quantity: number; note?: string }> }) {
        const table = await this.getTableByToken(token);

        if (!payload.items || payload.items.length === 0) {
            throw new Error('Order must contain at least one item');
        }

        const products = await this.prisma.product.findMany({
            where: {
                tenantId: table.tenantId,
                id: { in: payload.items.map((item) => item.productId) },
            },
        }) as Array<{
            id: string;
            name: string;
            price: { toNumber: () => number };
        }>;

        const productMap = new Map(products.map((product) => [product.id, product]));

        const orderItemsData = payload.items.map((item) => {
            const product = productMap.get(item.productId) as { id: string; name: string; price: { toNumber: () => number } } | undefined;
            if (!product) {
                throw new NotFoundException(`Product ${item.productId} not found`);
            }

            const quantity = Number(item.quantity ?? 1);
            const unitPrice = product.price.toNumber();
            const total = unitPrice * quantity;

            return {
                product: { connect: { id: product.id } },
                productName: product.name,
                unitPrice,
                quantity,
                total,
                note: item.note ?? null,
                status: 'PENDING' as const,
            };
        });

        const subtotal = orderItemsData.reduce((sum, item) => sum + Number(item.total), 0);
        const orderNumber = `QR-${Date.now()}`;

        const order = await this.prisma.order.create({
            data: {
                tenantId: table.tenantId,
                branchId: table.branchId,
                tableId: table.id,
                orderNumber,
                subtotal,
                discount: 0,
                total: subtotal,
                status: 'PENDING',
                note: 'Created from QR table ordering',
                items: {
                    create: orderItemsData,
                },
            },
            include: {
                items: true,
            },
        });

        return order;
    }
}
