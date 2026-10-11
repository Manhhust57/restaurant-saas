import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MembershipRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import type { StaffRole } from './dto/register.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    async registerStaff(
        tenantId: string,
        payload: { email: string; password: string; fullName: string; role: StaffRole },
    ) {
        if (!tenantId) {
            throw new BadRequestException('Tenant context is required');
        }

        const existingUser = await this.prisma.user.findUnique({ where: { email: payload.email } });
        if (existingUser) {
            throw new ConflictException('User already exists');
        }

        const passwordHash = await bcrypt.hash(payload.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: payload.email,
                passwordHash,
                fullName: payload.fullName,
                memberships: {
                    create: {
                        tenantId,
                        role: payload.role as MembershipRole,
                    },
                },
            },
            include: {
                memberships: {
                    where: { tenantId },
                },
            },
        });

        const membership = user.memberships[0];
        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            tenantId,
            role: membership.role,
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

        const tokenPayload = {
            sub: user.id,
            email: user.email,
            tenantId,
            role,
        };

        return {
            accessToken: this.jwtService.sign(tokenPayload),
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

        const tokenPayload = {
            sub: user.id,
            email: user.email,
            tenantId,
            role: membership.role,
        };

        return {
            accessToken: this.jwtService.sign(tokenPayload),
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
