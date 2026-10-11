import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Controller('health')
export class HealthController {
    @Get()
    check() {
        return {
            status: 'ok',
            service: 'restaurant-saas-api',
            timestamp: new Date().toISOString(),
        };
    }
}
