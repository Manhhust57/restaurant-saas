import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ProductsService } from './products.service';

class CreateProductDto {
    categoryId!: string;
    name!: string;
    description?: string;
    price!: number;
    imageUrl?: string;
}

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('api/v1/products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Get()
    async findAll(@Req() req: any) {
        return this.productsService.findAll(req.user.tenantId);
    }

    @Post()
    async create(@Req() req: any, @Body() dto: CreateProductDto) {
        return this.productsService.create(req.user.tenantId, dto);
    }
}
