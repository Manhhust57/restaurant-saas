import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { KitchenService } from './kitchen.service';

class UpdateKitchenStatusDto {
    @IsEnum(['CONFIRMED', 'PREPARING', 'READY', 'SERVED'])
    status!: string;
}

@ApiTags('kitchen')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('api/v1/kitchen')
export class KitchenController {
    constructor(private readonly kitchenService: KitchenService) { }

    @Get('tickets')
    async getTickets(@Req() req: any, @Query('branchId') branchId?: string) {
        return this.kitchenService.getTickets(req.user.tenantId, branchId);
    }

    @Patch('orders/:orderId/items/:itemId')
    async updateItemStatus(
        @Req() req: any,
        @Param('orderId') orderId: string,
        @Param('itemId') itemId: string,
        @Body() dto: UpdateKitchenStatusDto,
    ) {
        return this.kitchenService.updateItemStatus(req.user.tenantId, orderId, itemId, dto.status);
    }

    @Patch('orders/:orderId')
    async updateOrderStatus(
        @Req() req: any,
        @Param('orderId') orderId: string,
        @Body() dto: UpdateKitchenStatusDto,
    ) {
        return this.kitchenService.updateOrderStatus(req.user.tenantId, orderId, dto.status);
    }
}
