import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TablesService } from './tables.service';

class CreateTableDto {
    branchId!: string;
    name!: string;
    code!: string;
    capacity?: number;
    status?: string;
}

@ApiTags('tables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('api/v1/tables')
export class TablesController {
    constructor(private readonly tablesService: TablesService) { }

    @Get()
    async findAll(@Req() req: any, @Query('branchId') branchId?: string) {
        return this.tablesService.findAll(req.user.tenantId, branchId);
    }

    @Post()
    async create(@Req() req: any, @Body() dto: CreateTableDto) {
        return this.tablesService.create(req.user.tenantId, dto);
    }
}
