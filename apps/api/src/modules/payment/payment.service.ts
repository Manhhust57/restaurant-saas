import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentService {
    constructor(private readonly prisma: PrismaService) { }

    async createPayment(tenantId: string, orderId: string, payload: { method: string; amount: number; transactionId?: string }) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, tenantId },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        const payment = await this.prisma.payment.create({
            data: {
                orderId,
                method: payload.method as any,
                status: 'PAID',
                amount: payload.amount,
                transactionId: payload.transactionId ?? null,
            },
        });

        await this.prisma.order.update({
            where: { id: orderId },
            data: { status: 'COMPLETED' },
        });

        return payment;
    }
}
