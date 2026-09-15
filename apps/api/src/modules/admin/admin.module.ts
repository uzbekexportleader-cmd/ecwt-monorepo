import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ApplicationsModule } from '../applications/applications.module';
import { SubsidiesModule } from '../subsidies/subsidies.module';

@Module({
  imports: [ApplicationsModule, SubsidiesModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
