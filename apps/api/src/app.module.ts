import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { BranchesModule } from './modules/branches/branches.module';
import { TablesModule } from './modules/tables/tables.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { PublicModule } from './modules/public/public.module';
import { KitchenModule } from './modules/kitchen/kitchen.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ReportsModule } from './modules/reports/reports.module';
import { HealthModule } from './health/health.module';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        AuthModule,
        TenantsModule,
        BranchesModule,
        CategoriesModule,
        TablesModule,
        ProductsModule,
        OrdersModule,
        PublicModule,
        KitchenModule,
        PaymentModule,
        ReportsModule,
        HealthModule,
    ],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: TenantInterceptor,
        },
    ],
})
export class AppModule { }
