import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TableStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TABLE_STATUSES } from './dto/create-table.dto';

function asTableStatus(value: string): TableStatus {
    if (!(TABLE_STATUSES as readonly string[]).includes(value)) {
        throw new BadRequestException('Invalid table status');
    }
    return value as TableStatus;
}

@Injectable()
export class TablesService {
    constructor(private readonly prisma: PrismaService) { }

    async findOne(tenantId: string, id: string) {
        const result = await this.prisma.table.findFirst({ where: { id, tenantId }, include: { branch: true } });
        if (!result) throw new NotFoundException('Table not found');
        return result;
    }

    async update(tenantId: string, id: string, payload: Partial<{ branchId: string; name: string; code: string; capacity: number; status: string }>) {
        await this.findOne(tenantId, id);
        if (payload.branchId && !(await this.prisma.branch.findFirst({ where: { id: payload.branchId, tenantId } }))) {
            throw new NotFoundException('Branch not found');
        }

        const data: Prisma.TableUpdateInput = {};
        if (payload.name !== undefined) data.name = payload.name;
        if (payload.code !== undefined) data.code = payload.code;
        if (payload.capacity !== undefined) data.capacity = payload.capacity;
        if (payload.status !== undefined) data.status = asTableStatus(payload.status);
        if (payload.branchId !== undefined) data.branch = { connect: { id: payload.branchId } };

        return this.prisma.table.update({ where: { id }, data });
    }

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
        const branch = await this.prisma.branch.findFirst({ where: { id: payload.branchId, tenantId } });
        if (!branch) throw new NotFoundException('Branch not found');

        return this.prisma.table.create({
            data: {
                tenantId,
                branchId: branch.id,
                name: payload.name,
                code: payload.code,
                qrToken: `qr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                capacity: payload.capacity ?? null,
                status: payload.status ? asTableStatus(payload.status) : 'AVAILABLE',
            },
        });
    }
}
