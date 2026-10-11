import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import type { OrderChangedEvent } from './order-events';

function tokenFromCookieHeader(cookieHeader?: string): string | null {
    if (!cookieHeader) return null;
    const part = cookieHeader
        .split(';')
        .map((item) => item.trim())
        .find((item) => item.startsWith('access_token='));
    if (!part) return null;
    return decodeURIComponent(part.slice('access_token='.length));
}

function corsOrigins(): boolean | string[] {
    if (!process.env.CORS_ORIGIN) return true;
    return process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);
}

@WebSocketGateway({
    cors: {
        origin: corsOrigins(),
        credentials: true,
    },
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(OrdersGateway.name);

    @WebSocketServer()
    server!: Server;

    constructor(private readonly jwt: JwtService) {}

    async handleConnection(client: Socket) {
        try {
            const token =
                tokenFromCookieHeader(client.handshake.headers.cookie) ||
                (typeof client.handshake.auth?.token === 'string' ? client.handshake.auth.token : null);

            if (!token) {
                client.disconnect(true);
                return;
            }

            const payload = await this.jwt.verifyAsync<{
                sub: string;
                email: string;
                tenantId: string;
                role: string;
            }>(token, {
                secret: process.env.JWT_SECRET || 'dev-secret',
            });

            if (!payload?.tenantId) {
                client.disconnect(true);
                return;
            }

            client.data.userId = payload.sub;
            client.data.tenantId = payload.tenantId;
            client.data.role = payload.role;
            await client.join(this.tenantRoom(payload.tenantId));
            this.logger.debug(`socket ${client.id} joined tenant ${payload.tenantId}`);
        } catch (error) {
            this.logger.warn(`socket auth failed: ${error instanceof Error ? error.message : 'unknown'}`);
            client.disconnect(true);
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.debug(`socket ${client.id} disconnected`);
    }

    emitOrderChanged(tenantId: string, event: OrderChangedEvent) {
        this.server.to(this.tenantRoom(tenantId)).emit('order.changed', event);
    }

    private tenantRoom(tenantId: string) {
        return `tenant:${tenantId}`;
    }
}
