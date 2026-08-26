import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { validateEnv } from './config/env';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { ProductsModule } from './modules/products/products.module';
import { ListingsModule } from './modules/listings/listings.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PayoutsModule } from './modules/payouts/payouts.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { LeadsModule } from './modules/leads/leads.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { HealthModule } from './modules/health/health.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // .env noto'g'ri bo'lsa server umuman ko'tarilmaydi
      validate: validateEnv,
      envFilePath: ['.env.local', '.env'],
    }),

    // Umumiy chegara: bitta IP'dan daqiqasiga 120 so'rov.
    // Alohida marshrutlarda @Throttle bilan qattiqroq chegara qo'yilgan.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),

    PrismaModule,
    AuditModule,

    AuthModule,
    SuppliersModule,
    ProductsModule,
    ListingsModule,
    OrdersModule,
    PayoutsModule,
    PaymentsModule,
    LeadsModule,
    CategoriesModule,
    HealthModule,
  ],
  providers: [
    // Tartib muhim: avval rate limit, keyin token, keyin rol.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },

    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
