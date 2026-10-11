import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

/** Hold the order row until the surrounding transaction commits. */
export async function lockOrder(tx: Prisma.TransactionClient, tenantId: string, orderId: string) {
    const rows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "Order"
        WHERE id = ${orderId} AND "tenantId" = ${tenantId}
        FOR UPDATE
    `;
    if (!rows.length) {
        throw new NotFoundException('Order not found');
    }
}
