import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { PricingService, type PricingQuoteDto } from './pricing.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly service: PricingService) {}

  @Get('quote/:productId')
  @ApiOperation({ summary: '19-qadam: mahsulot bo‘yicha xarajat va tushum hisobi' })
  quote(
    @CurrentUser('sub') userId: string,
    @Param('productId') productId: string,
  ): Promise<PricingQuoteDto> {
    return this.service.quote(userId, productId);
  }
}
