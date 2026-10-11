import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { SalesQueryDto } from './dto/sales-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Roles('OWNER', 'MANAGER')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('api/v1/reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('sales')
    async getSalesSummary(
        @Req() req: any,
        @Query() query: SalesQueryDto,
    ) {
        return this.reportsService.getSalesSummary(req.user.tenantId, query);
    }
}
