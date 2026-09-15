import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  listingPlacedSchema,
  productReviewSchema,
  productStockSchema,
  publishProductSchema,
  upsertProductSchema,
  type ListingPlacedInput,
  type ProductReviewInput,
  type ProductStockInput,
  type PublishProductInput,
  type UpsertProductInput,
} from '@ecwt/validation';
import type { ProductDto } from '@ecwt/types';

import { ProductsService } from './products.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { zodBody } from '../../common/pipes/zod-validation.pipe';

@ApiTags('products')
@UseGuards(RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Mening mahsulotlarim' })
  list(@CurrentUser('sub') userId: string): Promise<ProductDto[]> {
    return this.service.list(userId);
  }

  @Get(':id')
  get(@CurrentUser('sub') userId: string, @Param('id') id: string): Promise<ProductDto> {
    return this.service.get(userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Mahsulot qo‘shish' })
  create(
    @CurrentUser('sub') userId: string,
    @Body(zodBody(upsertProductSchema)) body: UpsertProductInput,
  ): Promise<ProductDto> {
    return this.service.create(userId, body);
  }

  @Patch(':id')
  update(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body(zodBody(upsertProductSchema.partial())) body: Partial<UpsertProductInput>,
  ): Promise<ProductDto> {
    return this.service.update(userId, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string): Promise<void> {
    return this.service.remove(userId, id);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Mahsulotni marketplace‘larga chiqarish' })
  publish(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body(zodBody(publishProductSchema)) body: PublishProductInput,
  ): Promise<ProductDto> {
    return this.service.publish(userId, id, body.marketplaceIds);
  }

  /* ------------------------- tekshiruv oqimi -------------------------- */

  @Post(':id/submit')
  @ApiOperation({ summary: 'Mahsulotni tekshiruvga yuborish' })
  submit(@CurrentUser('sub') userId: string, @Param('id') id: string): Promise<ProductDto> {
    return this.service.submitForReview(userId, id);
  }

  @Patch(':id/stock')
  @ApiOperation({ summary: 'Qoldiqni o‘zgartirish' })
  stock(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body(zodBody(productStockSchema)) body: ProductStockInput,
  ): Promise<ProductDto> {
    return this.service.setStock(userId, id, body.stock);
  }

  /* ---------------------------- operator ------------------------------ */

  @Get('review/queue')
  @Roles('REVIEWER', 'ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Tekshiruv navbati (operator)' })
  queue(): Promise<ProductDto[]> {
    return this.service.reviewQueue();
  }

  @Post(':id/review')
  @Roles('REVIEWER', 'ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Mahsulot bo‘yicha qaror (operator)' })
  review(
    @Param('id') id: string,
    @Body(zodBody(productReviewSchema)) body: ProductReviewInput,
    @CurrentUser('sub') actorId: string,
  ): Promise<ProductDto> {
    return this.service.review(id, body.decision, body.note ?? null, actorId);
  }

  @Get('placement/queue')
  @Roles('REVIEWER', 'ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Qo‘lda joylashtirish navbati (operator)' })
  placementQueue() {
    return this.service.placementQueue();
  }

  @Post('placement/:listingId/placed')
  @Roles('REVIEWER', 'ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Joylashtirildi deb belgilash (operator)' })
  markPlaced(
    @Param('listingId') listingId: string,
    @Body(zodBody(listingPlacedSchema)) body: ListingPlacedInput,
    @CurrentUser('sub') actorId: string,
  ) {
    return this.service.markPlaced(listingId, body.listingUrl, body.externalId ?? null, actorId);
  }
}
