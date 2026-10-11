import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BranchesService {
    constructor(private readonly prisma: PrismaService) { }

    async findOne(tenantId: string, id: string) { const result = await this.prisma.branch.findFirst({ where: { id, tenantId }, include: { tables: true } }); if (!result) throw new NotFoundException('Branch not found'); return result; }
    async update(tenantId: string, id: string, payload: Partial<{ name: string; code: string; address: string }>) {
        await this.findOne(tenantId, id);
        const data: Prisma.BranchUpdateInput = {};
        if (payload.name !== undefined) data.name = payload.name;
        if (payload.code !== undefined) data.code = payload.code;
        if (payload.address !== undefined) data.address = payload.address;
        return this.prisma.branch.update({ where: { id }, data });
    }

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

    async remove(tenantId: string, id: string) {
        await this.findOne(tenantId, id);
        const orders = await this.prisma.order.count({ where: { tenantId, branchId: id } });
        if (orders > 0) {
            throw new ConflictException('Chi nhánh đã có đơn, không xóa được.');
        }

        try {
            return await this.prisma.branch.delete({ where: { id } });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
                throw new ConflictException('Chi nhánh đã có đơn, không xóa được.');
            }
            throw error;
        }
    }
}
