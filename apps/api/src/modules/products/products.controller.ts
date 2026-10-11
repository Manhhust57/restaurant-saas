import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductImagesService, ProductImageFile } from './product-images.service';
import { ProductsService } from './products.service';

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('api/v1/products')
export class ProductsController {
    constructor(
        private readonly productsService: ProductsService,
        private readonly images: ProductImagesService,
    ) { }

    @Post('images')
    @Roles('OWNER', 'MANAGER')
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 } }))
    async uploadImage(@Req() req: any, @UploadedFile() file?: ProductImageFile) {
        return this.images.upload(req.user.tenantId, file);
    }

    @Get()
    @Roles('OWNER', 'MANAGER', 'CASHIER', 'WAITER')
    async findAll(@Req() req: any) {
        return this.productsService.findAll(req.user.tenantId);
    }

    @Post()
    @Roles('OWNER', 'MANAGER')
    async create(@Req() req: any, @Body() dto: CreateProductDto) {
        return this.productsService.create(req.user.tenantId, dto);
    }

    @Delete(':id')
    @Roles('OWNER', 'MANAGER')
    async deactivate(@Req() req: any, @Param('id') id: string) {
        return this.productsService.deactivate(req.user.tenantId, id);
    }
}
