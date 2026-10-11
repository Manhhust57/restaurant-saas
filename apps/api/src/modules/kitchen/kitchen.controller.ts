import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { BranchFilterDto } from '../../common/dto/branch-filter.dto';
import { KitchenService } from './kitchen.service';

class UpdateKitchenStatusDto {
    @IsEnum(['PREPARING', 'READY', 'SERVED'])
    status!: string;
}

@ApiTags('kitchen')
@ApiBearerAuth()
@Roles('OWNER', 'MANAGER', 'KITCHEN')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('api/v1/kitchen')
export class KitchenController {
    constructor(private readonly kitchenService: KitchenService) { }

    @Get('tickets')
    async getTickets(@Req() req: any, @Query() query: BranchFilterDto) {
        return this.kitchenService.getTickets(req.user.tenantId, query.branchId);
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
