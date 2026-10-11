import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@ApiTags('branches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('api/v1/branches')
export class BranchesController {
    constructor(private readonly branchesService: BranchesService) { }

    @Get()
    @Roles('OWNER', 'MANAGER', 'CASHIER', 'WAITER')
    async findAll(@Req() req: any) {
        return this.branchesService.findAll(req.user.tenantId);
    }

    @Get(':id')
    @Roles('OWNER', 'MANAGER', 'CASHIER', 'WAITER')
    findOne(@Req() req: any, @Param('id') id: string) {
        return this.branchesService.findOne(req.user.tenantId, id);
    }

    @Patch(':id')
    @Roles('OWNER', 'MANAGER')
    async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateBranchDto) {
        return this.branchesService.update(req.user.tenantId, id, dto);
    }

    @Post()
    @Roles('OWNER', 'MANAGER')
    async create(@Req() req: any, @Body() dto: CreateBranchDto) {
        return this.branchesService.create(req.user.tenantId, dto);
    }

    @Delete(':id')
    @Roles('OWNER', 'MANAGER')
    async remove(@Req() req: any, @Param('id') id: string) {
        return this.branchesService.remove(req.user.tenantId, id);
    }
}
