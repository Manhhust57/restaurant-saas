import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('api/v1/categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Get()
    @Roles('OWNER', 'MANAGER', 'CASHIER', 'WAITER')
    async findAll(@Req() req: any) {
        return this.categoriesService.findAll(req.user.tenantId);
    }

    @Post()
    @Roles('OWNER', 'MANAGER')
    async create(@Req() req: any, @Body() dto: CreateCategoryDto) {
        return this.categoriesService.create(req.user.tenantId, dto);
    }

    @Delete(':id')
    @Roles('OWNER', 'MANAGER')
    async deactivate(@Req() req: any, @Param('id') id: string) {
        return this.categoriesService.deactivate(req.user.tenantId, id);
    }
}
