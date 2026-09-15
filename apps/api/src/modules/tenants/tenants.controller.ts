import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantsService } from './tenants.service';

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/tenants')
export class TenantsController {
    constructor(private readonly tenantsService: TenantsService) { }

    @Get('me')
    async getCurrentTenant(@Req() req: any) {
        return this.tenantsService.getCurrentTenant(req.user.userId);
    }
}
