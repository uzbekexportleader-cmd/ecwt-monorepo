import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AppConfigModule } from './config/config.module';
import { limits, loadEnv } from './config/env';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './common/audit/audit.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { ArtisanProfileModule } from './modules/artisan-profile/artisan-profile.module';
import { SellerApplicationModule } from './modules/seller-application/seller-application.module';
import { MahallaSubsidyModule } from './modules/mahalla-subsidy/mahalla-subsidy.module';
import { CompanyModule } from './modules/company/company.module';
import { ServicePaymentModule } from './modules/service-payment/service-payment.module';
import { ContractModule } from './modules/contract/contract.module';
import { JourneyModule } from './modules/journey/journey.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { CraftCategoriesModule } from './modules/craft-categories/craft-categories.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { SubsidiesModule } from './modules/subsidies/subsidies.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ProductsModule } from './modules/products/products.module';
import { MarketplacesModule } from './modules/marketplaces/marketplaces.module';
import { AiModule } from './modules/ai/ai.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { AdminModule } from './modules/admin/admin.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    AuditModule,
    JwtModule.register({ global: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: limits(loadEnv()).ratePerMinute }]),

    HealthModule,

    AuthModule,
    UsersModule,
    SellerApplicationModule,
    MahallaSubsidyModule,
    CompanyModule,
    ServicePaymentModule,
    ContractModule,
    JourneyModule,
    PricingModule,
    ArtisanProfileModule,
    CraftCategoriesModule,
    DocumentsModule,
    SubsidiesModule,
    ApplicationsModule,
    NotificationsModule,
    ProductsModule,
    MarketplacesModule,
    AiModule,
    ContractsModule,
    AdminModule,
    AnalyticsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
