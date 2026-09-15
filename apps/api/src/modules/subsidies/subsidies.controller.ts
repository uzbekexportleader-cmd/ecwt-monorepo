import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { EligibilityDto, SubsidyDto, SubsidyWithEligibilityDto } from '@ecwt/types';

import { SubsidiesService } from './subsidies.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('subsidies')
@Controller('subsidies')
export class SubsidiesController {
  constructor(private readonly service: SubsidiesService) {}

  @Get()
  @ApiOperation({ summary: 'Faol subsidiyalar + foydalanuvchi mosligi' })
  list(
    @CurrentUser('sub') userId: string,
    @Query('onlyEligible') onlyEligible?: string,
  ): Promise<SubsidyWithEligibilityDto[]> {
    return this.service.listWithEligibility(userId, onlyEligible === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Subsidiya tafsiloti' })
  get(@Param('id') id: string): Promise<SubsidyDto> {
    return this.service.getById(id);
  }

  @Get(':id/eligibility')
  @ApiOperation({ summary: 'Ushbu subsidiya bo‘yicha moslik tekshiruvi' })
  eligibility(@CurrentUser('sub') userId: string, @Param('id') id: string): Promise<EligibilityDto> {
    return this.service.eligibilityFor(userId, id);
  }
}
