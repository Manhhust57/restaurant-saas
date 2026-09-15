import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    async register(email: string, password: string, fullName: string) {
        const existingUser = await this.prisma.user.findUnique({ where: { email } });

        if (existingUser) {
            throw new ConflictException('User already exists');
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({
            data: { email, passwordHash, fullName },
        });

        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
        };
    }

    async login(email: string, password: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: { memberships: true },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const defaultMembership = user.memberships[0];
        const tenantId = defaultMembership?.tenantId ?? '';
        const role = defaultMembership?.role ?? 'OWNER';

        const payload = {
            sub: user.id,
            email: user.email,
            tenantId,
            role,
        };

        return {
            accessToken: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                tenantId,
                role,
            },
        };
    }

    async switchTenant(userId: string, tenantId: string) {
        const membership = await this.prisma.membership.findFirst({
            where: {
                userId,
                tenantId,
            },
        });

        if (!membership) {
            throw new UnauthorizedException('User is not a member of this tenant');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const payload = {
            sub: user.id,
            email: user.email,
            tenantId,
            role: membership.role,
        };

        return {
            accessToken: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                tenantId,
                role: membership.role,
            },
        };
    }
}
