import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(tenantId: string) {
        return this.prisma.product.findMany({
            where: { tenantId, isActive: true },
            include: { category: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(tenantId: string, payload: { categoryId: string; name: string; description?: string; price: number; imageUrl?: string }) {
        const category = await this.prisma.category.findFirst({ where: { id: payload.categoryId, tenantId } });
        if (!category) throw new NotFoundException('Category not found');

        return this.prisma.product.create({
            data: {
                tenantId,
                categoryId: payload.categoryId,
                name: payload.name,
                description: payload.description ?? null,
                price: payload.price,
                imageUrl: payload.imageUrl ?? null,
            },
        });
    }

    async deactivate(tenantId: string, id: string) {
        const product = await this.prisma.product.findFirst({
            where: { id, tenantId, isActive: true },
        });
        if (!product) throw new NotFoundException('Product not found');

        return this.prisma.product.update({
            where: { id },
            data: { isActive: false },
        });
    }
}
