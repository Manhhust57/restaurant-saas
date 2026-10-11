import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { MembershipRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantsService {
    constructor(private readonly prisma: PrismaService) { }

    async requireManagerAccess(userId: string, tenantId: string) {
        return this.requireRoleAccess(userId, tenantId, ['OWNER', 'MANAGER']);
    }

    async requireRoleAccess(userId: string, tenantId: string, roles: MembershipRole[]) {
        const membership = await this.prisma.membership.findUnique({
            where: { userId_tenantId: { userId, tenantId } },
            select: { role: true },
        });

        if (!membership || !roles.includes(membership.role)) {
            throw new ForbiddenException('You do not have permission for this operation');
        }
    }

    async create(userId: string, payload: { name: string; slug: string }) {
        const ownedTenant = await this.prisma.membership.findFirst({
            where: {
                userId,
                role: 'OWNER',
            },
            select: { tenantId: true },
        });

        if (ownedTenant) {
            throw new ConflictException('User already owns a tenant');
        }

        return this.prisma.tenant.create({ data: { name: payload.name, slug: payload.slug, memberships: { create: { userId, role: 'OWNER' } } } });
    }

    async findOne(userId: string, tenantId: string) {
        const membership = await this.prisma.membership.findUnique({ where: { userId_tenantId: { userId, tenantId } }, include: { tenant: { include: { branches: true } } } });
        if (!membership) throw new ForbiddenException('You are not a member of this tenant');
        return membership.tenant;
    }

    async getCurrentTenant(userId: string) {
        const memberships = await this.prisma.membership.findMany({
            where: { userId },
            include: { tenant: true },
            orderBy: { createdAt: 'desc' },
        });

        return {
            userId,
            memberships: memberships.map((membership) => ({
                id: membership.id,
                tenantId: membership.tenantId,
                role: membership.role,
                tenant: membership.tenant,
            })),
        };
    }
}
