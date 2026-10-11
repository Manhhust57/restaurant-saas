import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { AddOrderItemsDto } from './dto/add-order-items.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('api/v1/orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Get()
    @Roles('OWNER', 'MANAGER', 'CASHIER', 'WAITER')
    async findAll(@Req() req: any) {
        return this.ordersService.findAll(req.user.tenantId);
    }

    @Get(':id')
    @Roles('OWNER', 'MANAGER', 'CASHIER', 'WAITER')
    async findOne(@Req() req: any, @Param('id') id: string) {
        return this.ordersService.findOne(req.user.tenantId, id);
    }

    @Post()
    @Roles('OWNER', 'MANAGER', 'CASHIER', 'WAITER')
    async create(@Req() req: any, @Body() dto: CreateOrderDto) {
        return this.ordersService.create(req.user.tenantId, dto);
    }

    @Post(':id/confirm')
    @Roles('OWNER', 'MANAGER', 'CASHIER')
    async confirm(@Req() req: any, @Param('id') id: string) {
        return this.ordersService.confirm(req.user.tenantId, id);
    }

    @Post(':id/items')
    @Roles('OWNER', 'MANAGER', 'CASHIER', 'WAITER')
    async addItems(@Req() req: any, @Param('id') id: string, @Body() dto: AddOrderItemsDto) {
        return this.ordersService.addItems(req.user.tenantId, id, dto.items);
    }

    @Patch(':id/items/:itemId')
    @Roles('OWNER', 'MANAGER', 'CASHIER', 'WAITER')
    async updateItem(
        @Req() req: any,
        @Param('id') id: string,
        @Param('itemId') itemId: string,
        @Body() dto: UpdateOrderItemDto,
    ) {
        return this.ordersService.updateItem(req.user.tenantId, id, itemId, dto);
    }

    @Post(':id/items/:itemId/cancel')
    @Roles('OWNER', 'MANAGER', 'CASHIER', 'WAITER')
    async cancelItem(
        @Req() req: any,
        @Param('id') id: string,
        @Param('itemId') itemId: string,
    ) {
        return this.ordersService.cancelItem(req.user.tenantId, id, itemId);
    }

    @Post(':id/cancel')
    @Roles('OWNER', 'MANAGER', 'CASHIER')
    async cancelOrder(@Req() req: any, @Param('id') id: string) {
        return this.ordersService.cancelOrder(req.user.tenantId, id);
    }
}
