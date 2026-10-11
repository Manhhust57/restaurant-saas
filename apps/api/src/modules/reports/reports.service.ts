import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
    constructor(private readonly prisma: PrismaService) { }

    async getSalesSummary(tenantId: string, filters: { branchId?: string; from?: string; to?: string }) {
        const where: Prisma.OrderWhereInput = {
            tenantId,
            status: { not: 'CANCELLED' },
        };

        if (filters.branchId) {
            where.branchId = filters.branchId;
        }

        if (filters.from || filters.to) {
            where.createdAt = {};
            if (filters.from) {
                where.createdAt.gte = this.parseDate(filters.from, false);
            }
            if (filters.to) {
                where.createdAt.lte = this.parseDate(filters.to, true);
            }
        }

        const [summary, statusCounts, orders] = await Promise.all([
            this.prisma.order.aggregate({
                where,
                _count: { _all: true },
                _sum: { subtotal: true, discount: true, total: true },
            }),
            this.prisma.order.groupBy({
                by: ['status'],
                where,
                _count: { _all: true },
            }),
            this.prisma.order.findMany({
                where,
                select: { total: true, createdAt: true },
                orderBy: { createdAt: 'asc' },
            }),
        ]);

        const daily = new Map<string, { orders: number; revenue: number }>();
        for (const order of orders) {
            const day = order.createdAt.toISOString().slice(0, 10);
            const current = daily.get(day) ?? { orders: 0, revenue: 0 };
            current.orders += 1;
            current.revenue += Number(order.total);
            daily.set(day, current);
        }

        return {
            filters,
            totals: {
                orders: summary._count._all,
                subtotal: Number(summary._sum.subtotal ?? 0),
                discount: Number(summary._sum.discount ?? 0),
                revenue: Number(summary._sum.total ?? 0),
            },
            statuses: statusCounts.map((entry) => ({
                status: entry.status,
                orders: entry._count._all,
            })),
            daily: Array.from(daily, ([date, values]) => ({ date, ...values })),
        };
    }

    private parseDate(value: string, endOfDay: boolean) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            throw new BadRequestException(`Invalid report date: ${value}`);
        }

        if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            date.setUTCHours(23, 59, 59, 999);
        }

        return date;
    }
}
