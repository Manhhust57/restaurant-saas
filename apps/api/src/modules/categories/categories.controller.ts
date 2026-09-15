import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CategoriesService } from './categories.service';

class CreateCategoryDto {
    name!: string;
    sortOrder?: number;
}

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('api/v1/categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Get()
    async findAll(@Req() req: any) {
        return this.categoriesService.findAll(req.user.tenantId);
    }

    @Post()
    async create(@Req() req: any, @Body() dto: CreateCategoryDto) {
        return this.categoriesService.create(req.user.tenantId, dto);
    }
}
