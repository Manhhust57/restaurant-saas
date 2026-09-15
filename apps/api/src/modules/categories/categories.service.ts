import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoriesService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(tenantId: string) {
        return this.prisma.category.findMany({
            where: { tenantId },
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
}
