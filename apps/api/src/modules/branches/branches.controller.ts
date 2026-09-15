import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { BranchesService } from './branches.service';

class CreateBranchDto {
    name!: string;
    code!: string;
    address?: string;
}

@ApiTags('branches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('api/v1/branches')
export class BranchesController {
    constructor(private readonly branchesService: BranchesService) { }

    @Get()
    async findAll(@Req() req: any) {
        return this.branchesService.findAll(req.user.tenantId);
    }

    @Post()
    async create(@Req() req: any, @Body() dto: CreateBranchDto) {
        return this.branchesService.create(req.user.tenantId, dto);
    }
}
