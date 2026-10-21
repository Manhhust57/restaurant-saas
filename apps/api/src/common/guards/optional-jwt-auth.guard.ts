import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Allows the request through even when there is no/invalid JWT.
 * Sets `req.user` to the authenticated user, or `null` when anonymous.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const result = await super.canActivate(context);
            return Boolean(result);
        } catch {
            return true;
        }
    }

    handleRequest<TUser = unknown>(err: unknown, user: TUser): TUser | null {
        if (err || !user) {
            return null;
        }
        return user;
    }
}
