import { Module } from '@nestjs/common';
import { ArtisanProfileController } from './artisan-profile.controller';
import { ArtisanProfileService } from './artisan-profile.service';
import { IdentityModule } from '../identity/identity.module';
import { RegistryModule } from '../registry/registry.module';
import { TelegramModule } from '../telegram/telegram.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DocumentsModule } from '../documents/documents.module';
import { OnboardingAlertService } from './onboarding-alert.service';

@Module({
  imports: [IdentityModule, RegistryModule, TelegramModule, NotificationsModule, DocumentsModule],
  controllers: [ArtisanProfileController],
  providers: [ArtisanProfileService, OnboardingAlertService],
  exports: [ArtisanProfileService],
})
export class ArtisanProfileModule {}
