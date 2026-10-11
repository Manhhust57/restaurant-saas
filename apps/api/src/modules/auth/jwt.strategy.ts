import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

function tokenFromCookie(request: Request): string | null {
    const header = request.headers.cookie;
    if (!header) return null;
    const part = header.split(';').map((item) => item.trim()).find((item) => item.startsWith('access_token='));
    if (!part) return null;
    return decodeURIComponent(part.slice('access_token='.length));
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([tokenFromCookie]),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'dev-secret',
        });
    }

    async validate(payload: any) {
        return {
            userId: payload.sub,
            email: payload.email,
            tenantId: payload.tenantId,
            role: payload.role,
        };
    }
}
