import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { updateProfileSchema, type UpdateProfileInput } from '@ecwt/validation';
import type { ArtisanProfileDto, ProfileCompletionDto } from '@ecwt/types';

import { ArtisanProfileService } from './artisan-profile.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { zodBody } from '../../common/pipes/zod-validation.pipe';

@ApiTags('artisan-profile')
@Controller('artisan-profile')
export class ArtisanProfileController {
  constructor(private readonly service: ArtisanProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Hunarmand profilini olish' })
  get(@CurrentUser('sub') userId: string): Promise<ArtisanProfileDto> {
    return this.service.getOrCreate(userId);
  }

  @Put()
  @ApiOperation({ summary: 'Profilni yangilash' })
  update(
    @CurrentUser('sub') userId: string,
    @Body(zodBody(updateProfileSchema)) body: UpdateProfileInput,
  ): Promise<ArtisanProfileDto> {
    return this.service.update(userId, body);
  }

  @Get('completion')
  @ApiOperation({ summary: 'Profil to‘ldirilganligi va yetishmayotgan qadamlar' })
  completion(@CurrentUser('sub') userId: string): Promise<ProfileCompletionDto> {
    return this.service.completion(userId);
  }

  @Post('verify/:kind')
  @ApiOperation({ summary: 'Reyestr orqali tasdiqlashni ishga tushirish' })
  verify(
    @CurrentUser('sub') userId: string,
    @Param('kind') kind: 'identity' | 'face' | 'business' | 'membership' | 'bank',
  ): Promise<ArtisanProfileDto> {
    return this.service.verify(userId, kind);
  }
}
