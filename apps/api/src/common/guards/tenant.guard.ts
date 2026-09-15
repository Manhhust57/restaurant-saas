import {
    CanActivate,
    ExecutionContext,
    Injectable,
    ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();
        const user = req.user;
        const tenant = req.tenant ?? (user?.tenantId
            ? { tenantId: user.tenantId, role: user.role }
            : undefined);

        if (tenant && !req.tenant) {
            req.tenant = tenant;
        }

        if (!tenant) {
            throw new ForbiddenException('Tenant context is required');
        }

        return true;
    }
}
