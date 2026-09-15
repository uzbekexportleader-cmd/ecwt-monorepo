import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { MarketplaceDto } from '@ecwt/types';

import { MarketplacesService } from './marketplaces.service';

@ApiTags('marketplaces')
@Controller('marketplaces')
export class MarketplacesController {
  constructor(private readonly service: MarketplacesService) {}

  @Get()
  @ApiOperation({ summary: 'ECWT qollab-quvvatlaydigan marketplace lar' })
  list(): Promise<MarketplaceDto[]> {
    return this.service.list();
  }
}
