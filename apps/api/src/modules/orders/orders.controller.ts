import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { OrdersService } from './orders.service';

class CreateOrderDto {
    branchId!: string;
    tableId?: string;
    note?: string;
}

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('api/v1/orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Get()
    async findAll(@Req() req: any) {
        return this.ordersService.findAll(req.user.tenantId);
    }

    @Post()
    async create(@Req() req: any, @Body() dto: CreateOrderDto) {
        return this.ordersService.create(req.user.tenantId, dto);
    }

    @Post(':id/confirm')
    async confirm(@Req() req: any, @Param('id') id: string) {
        return this.ordersService.confirm(req.user.tenantId, id);
    }
}

