import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoriesService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(tenantId: string) {
        return this.prisma.category.findMany({
            where: { tenantId, isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
    }

    async create(tenantId: string, payload: { name: string; sortOrder?: number }) {
        return this.prisma.category.create({
            data: {
                tenantId,
                name: payload.name,
                sortOrder: payload.sortOrder ?? 0,
            },
        });
    }

    async deactivate(tenantId: string, id: string) {
        return this.prisma.$transaction(async (tx) => {
            const category = await tx.category.findFirst({
                where: { id, tenantId, isActive: true },
            });
            if (!category) throw new NotFoundException('Category not found');

            await tx.product.updateMany({
                where: { tenantId, categoryId: id, isActive: true },
                data: { isActive: false },
            });

            return tx.category.update({
                where: { id },
                data: { isActive: false },
            });
        });
    }
}
