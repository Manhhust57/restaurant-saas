import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { BranchFilterDto } from '../../common/dto/branch-filter.dto';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { TablesService } from './tables.service';

@ApiTags('tables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('api/v1/tables')
export class TablesController {
    constructor(private readonly tablesService: TablesService) { }

    @Get()
    @Roles('OWNER', 'MANAGER', 'CASHIER', 'WAITER')
    async findAll(@Req() req: any, @Query() query: BranchFilterDto) {
        return this.tablesService.findAll(req.user.tenantId, query.branchId);
    }

    @Get(':id')
    @Roles('OWNER', 'MANAGER', 'CASHIER', 'WAITER')
    findOne(@Req() req: any, @Param('id') id: string) {
        return this.tablesService.findOne(req.user.tenantId, id);
    }

    @Patch(':id')
    @Roles('OWNER', 'MANAGER')
    async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateTableDto) {
        return this.tablesService.update(req.user.tenantId, id, dto);
    }

    @Post()
    @Roles('OWNER', 'MANAGER')
    async create(@Req() req: any, @Body() dto: CreateTableDto) {
        return this.tablesService.create(req.user.tenantId, dto);
    }
}
