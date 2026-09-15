import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantsService {
    constructor(private readonly prisma: PrismaService) { }

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
