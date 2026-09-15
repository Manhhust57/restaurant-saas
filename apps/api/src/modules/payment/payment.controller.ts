import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PaymentService } from './payment.service';

class CreatePaymentDto {
    @IsEnum(['CASH', 'BANK_TRANSFER', 'CARD', 'QR', 'OTHER'])
    method!: string;

    @IsNumber()
    @Min(0)
    amount!: number;

    @IsOptional()
    @IsString()
    transactionId?: string;
}

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('api/v1/payments')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('orders/:orderId')
    async createPayment(@Req() req: any, @Param('orderId') orderId: string, @Body() dto: CreatePaymentDto) {
        return this.paymentService.createPayment(req.user.tenantId, orderId, dto);
    }
}
