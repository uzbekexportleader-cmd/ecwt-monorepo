import { Module } from '@nestjs/common';
import { SubsidiesController } from './subsidies.controller';
import { SubsidiesService } from './subsidies.service';
import { EligibilityService } from './eligibility.service';

@Module({
  controllers: [SubsidiesController],
  providers: [SubsidiesService, EligibilityService],
  exports: [SubsidiesService, EligibilityService],
})
export class SubsidiesModule {}
