import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentService } from './payment.service';

@ApiTags('payments')
@ApiBearerAuth()
@Roles('OWNER', 'MANAGER', 'CASHIER')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('api/v1/payments')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('orders/:orderId')
    async createPayment(@Req() req: any, @Param('orderId') orderId: string, @Body() dto: CreatePaymentDto) {
        return this.paymentService.createPayment(req.user.tenantId, orderId, dto);
    }
}
