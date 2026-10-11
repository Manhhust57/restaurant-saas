import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SwitchTenantDto } from './dto/switch-tenant.dto';

const ACCESS_COOKIE = 'access_token';

function authCookieOptions(token: string) {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()) as { exp?: number };
    const maxAge = payload.exp ? payload.exp * 1000 - Date.now() : 7 * 24 * 60 * 60 * 1000;
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        maxAge: Math.max(maxAge, 0),
    };
}

@ApiTags('auth')
@Controller('api/v1/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @Roles('OWNER', 'MANAGER')
    @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
    async register(@Req() req: any, @Body() dto: RegisterDto) {
        return this.authService.registerStaff(req.user.tenantId, dto);
    }

    @Post('login')
    @Throttle({ default: { limit: 10, ttl: 60_000 } })
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const result = await this.authService.login(dto.email, dto.password);
        res.cookie(ACCESS_COOKIE, result.accessToken, authCookieOptions(result.accessToken));
        return { user: result.user };
    }

    @Post('logout')
    logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie(ACCESS_COOKIE, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });
        return { ok: true };
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    me(@Req() req: { user: { email: string; tenantId: string; role: string } }) {
        return {
            email: req.user.email,
            tenantId: req.user.tenantId ?? '',
            role: req.user.role,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Post('switch-tenant')
    async switchTenant(@Req() req: { user: { userId: string } }, @Body() dto: SwitchTenantDto, @Res({ passthrough: true }) res: Response) {
        const result = await this.authService.switchTenant(req.user.userId, dto.tenantId);
        res.cookie(ACCESS_COOKIE, result.accessToken, authCookieOptions(result.accessToken));
        return { user: result.user };
    }
}
