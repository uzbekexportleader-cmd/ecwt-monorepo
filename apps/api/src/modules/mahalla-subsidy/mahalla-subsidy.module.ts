import { Module } from '@nestjs/common';

import { MahallaSubsidyController } from './mahalla-subsidy.controller';
import { MahallaSubsidyService } from './mahalla-subsidy.service';

@Module({
  controllers: [MahallaSubsidyController],
  providers: [MahallaSubsidyService],
  exports: [MahallaSubsidyService],
})
export class MahallaSubsidyModule {}
