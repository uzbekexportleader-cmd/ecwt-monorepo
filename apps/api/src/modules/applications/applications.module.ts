import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { ApplicationStateService } from './application-state.service';
import { SubsidiesModule } from '../subsidies/subsidies.module';
import { DocumentsModule } from '../documents/documents.module';
import { SignatureModule } from '../signature/signature.module';

@Module({
  imports: [SubsidiesModule, DocumentsModule, SignatureModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, ApplicationStateService],
  exports: [ApplicationsService, ApplicationStateService],
})
export class ApplicationsModule {}
