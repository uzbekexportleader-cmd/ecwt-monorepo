import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import {
  changeListingStatusSchema,
  createListingSchema,
  listingListQuerySchema,
  updateListingSchema,
  type ChangeListingStatusInput,
  type CreateListingInput,
  type JwtPayload,
  type ListingListQuery,
  type UpdateListingInput,
} from '@ecwt/contracts';
import { ListingsService } from './listings.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, Roles } from '../../common/decorators';
import { requireSupplierId } from '../../common/require-supplier';
import type { AppRequest } from '../../common/types';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(listingListQuerySchema)) query: ListingListQuery,
    @CurrentUser() user: JwtPayload,
  ) {
    const scope = user.role === 'SUPPLIER' ? requireSupplierId(user) : undefined;
    return this.listings.list(query, scope);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const scope = user.role === 'SUPPLIER' ? requireSupplierId(user) : undefined;
    return this.listings.getById(id, scope);
  }

  // E'lonni yaratish va boshqarish — faqat ECWT xodimlari
  @Roles('ADMIN', 'STAFF')
  @Post()
  create(
    @Body(new ZodValidationPipe(createListingSchema)) dto: CreateListingInput,
    @CurrentUser('sub') userId: string,
    @Req() req: AppRequest,
  ) {
    return this.listings.create(dto, { userId, ip: req.ip, requestId: req.requestId });
  }

  @Roles('ADMIN', 'STAFF')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateListingSchema)) dto: UpdateListingInput,
  ) {
    return this.listings.update(id, dto);
  }

  @Roles('ADMIN', 'STAFF')
  @Post(':id/status')
  changeStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(changeListingStatusSchema)) dto: ChangeListingStatusInput,
    @CurrentUser('sub') userId: string,
    @Req() req: AppRequest,
  ) {
    return this.listings.changeStatus(id, dto, { userId, ip: req.ip, requestId: req.requestId });
  }
}
