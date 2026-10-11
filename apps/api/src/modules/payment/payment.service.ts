import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentMethod, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { lockOrder } from '../orders/order-lock';
import { OrdersGateway } from '../realtime/orders.gateway';

const PAYMENT_METHODS: readonly PaymentMethod[] = ['CASH', 'BANK_TRANSFER', 'CARD', 'QR', 'OTHER'];

function asPaymentMethod(value: string): PaymentMethod {
    if (!PAYMENT_METHODS.includes(value as PaymentMethod)) {
        throw new BadRequestException('Invalid payment method');
    }
    return value as PaymentMethod;
}

@Injectable()
export class PaymentService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly ordersGateway: OrdersGateway,
    ) { }

    async createPayment(tenantId: string, orderId: string, payload: { method: string; amount: number; transactionId?: string }) {
        const result = await this.prisma.$transaction(async (tx) => {
            await lockOrder(tx, tenantId, orderId);
            const order = await tx.order.findFirst({
                where: { id: orderId, tenantId },
                include: {
                    payments: {
                        where: { status: 'PAID' },
                        select: { id: true },
                    },
                },
            });

            if (!order) {
                throw new NotFoundException('Order not found');
            }

            if (order.status === 'CANCELLED') {
                throw new ConflictException('Cancelled orders cannot be paid');
            }

            if (order.status === 'COMPLETED' || order.payments.length > 0) {
                throw new ConflictException('Order is already paid');
            }

            const expectedAmount = new Prisma.Decimal(order.total);
            const submittedAmount = new Prisma.Decimal(payload.amount);

            if (!submittedAmount.equals(expectedAmount)) {
                throw new BadRequestException(`Payment amount must equal order total (${expectedAmount.toFixed(2)})`);
            }

            const payment = await tx.payment.create({
                data: {
                    orderId,
                    method: asPaymentMethod(payload.method),
                    status: 'PAID',
                    amount: expectedAmount,
                    transactionId: payload.transactionId ?? null,
                },
            });

            const completed = await tx.order.updateMany({
                where: {
                    id: orderId,
                    tenantId,
                    status: { notIn: ['CANCELLED', 'COMPLETED'] },
                },
                data: { status: 'COMPLETED' },
            });
            if (completed.count !== 1) {
                throw new ConflictException('Order is already paid');
            }

            return { payment, branchId: order.branchId, tableId: order.tableId };
        });

        this.ordersGateway.emitOrderChanged(tenantId, {
            reason: 'paid',
            orderId,
            status: 'COMPLETED',
            branchId: result.branchId,
            tableId: result.tableId,
        });

        return result.payment;
    }
}
