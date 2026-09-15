import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TablesService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(tenantId: string, branchId?: string) {
        return this.prisma.table.findMany({
            where: {
                tenantId,
                ...(branchId ? { branchId } : {}),
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(tenantId: string, payload: { branchId: string; name: string; code: string; capacity?: number; status?: string }) {
        return this.prisma.table.create({
            data: {
                tenantId,
                branchId: payload.branchId,
                name: payload.name,
                code: payload.code,
                qrToken: `qr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                capacity: payload.capacity ?? null,
                status: (payload.status as any) ?? 'AVAILABLE',
            },
        });
    }
}
