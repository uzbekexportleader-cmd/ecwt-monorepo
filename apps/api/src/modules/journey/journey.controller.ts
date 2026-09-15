import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { JourneyDto } from '@ecwt/types';
import { mahallaVisitSchema, salesModeSchema, type MahallaVisitInput, type SalesModeInput } from '@ecwt/validation';

import { JourneyService } from './journey.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { zodBody } from '../../common/pipes/zod-validation.pipe';

@ApiTags('journey')
@Controller('journey')
export class JourneyController {
  constructor(private readonly service: JourneyService) {}

  @Get()
  @ApiOperation({ summary: 'Hozir qaysi qadamdaman' })
  current(@CurrentUser('sub') userId: string): Promise<JourneyDto> {
    return this.service.current(userId);
  }

  @Post('mahalla-visit')
  @ApiOperation({ summary: '12-qadam: Hokim yordamchisi ma’lumotlari' })
  mahallaVisit(
    @CurrentUser('sub') userId: string,
    @Body(zodBody(mahallaVisitSchema)) body: MahallaVisitInput,
  ): Promise<JourneyDto> {
    return this.service.saveMahallaVisit(userId, body);
  }

  @Post('sales-mode')
  @ApiOperation({ summary: '17-qadam: FBM yoki FBA' })
  salesMode(
    @CurrentUser('sub') userId: string,
    @Body(zodBody(salesModeSchema)) body: SalesModeInput,
  ): Promise<JourneyDto> {
    return this.service.chooseSalesMode(userId, body.mode);
  }

  @Post('earnings-seen')
  @ApiOperation({ summary: '19-qadam: hisob-kitob ko‘rib chiqildi' })
  earningsSeen(@CurrentUser('sub') userId: string): Promise<JourneyDto> {
    return this.service.markEarningsSeen(userId);
  }
}
