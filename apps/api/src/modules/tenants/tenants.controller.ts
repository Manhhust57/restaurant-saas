import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantsService } from './tenants.service';

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/tenants')
export class TenantsController {
    constructor(private readonly tenantsService: TenantsService) { }

    @Post()
    create(@Req() req: any, @Body() dto: CreateTenantDto) { return this.tenantsService.create(req.user.userId, dto); }

    @Get('me')
    async getCurrentTenant(@Req() req: any) {
        return this.tenantsService.getCurrentTenant(req.user.userId);
    }

    @Get(':id')
    findOne(@Req() req: any, @Param('id') id: string) { return this.tenantsService.findOne(req.user.userId, id); }
}
