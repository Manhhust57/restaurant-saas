import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BranchesService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(tenantId: string) {
        return this.prisma.branch.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(tenantId: string, payload: { name: string; code: string; address?: string }) {
        return this.prisma.branch.create({
            data: {
                tenantId,
                name: payload.name,
                code: payload.code,
                address: payload.address ?? null,
            },
        });
    }
}
