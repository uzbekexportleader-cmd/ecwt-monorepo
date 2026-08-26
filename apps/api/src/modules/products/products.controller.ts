import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  createProductSchema,
  productListQuerySchema,
  reviewProductSchema,
  updateProductSchema,
  type CreateProductInput,
  type JwtPayload,
  type ProductListQuery,
  type ReviewProductInput,
  type UpdateProductInput,
} from '@ecwt/contracts';
import { ProductsService } from './products.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, Roles } from '../../common/decorators';
import { requireSupplierId } from '../../common/require-supplier';
import type { AppRequest } from '../../common/types';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  /**
   * Ro'yxat. Hamkor uchun avtomatik ravishda faqat o'z mahsulotlari,
   * admin uchun barchasi (yoki ?supplierId=... bilan bittasiniki).
   */
  @Get()
  list(
    @Query(new ZodValidationPipe(productListQuerySchema)) query: ProductListQuery,
    @CurrentUser() user: JwtPayload,
  ) {
    const scope = user.role === 'SUPPLIER' ? requireSupplierId(user) : undefined;
    return this.products.list(query, scope);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const scope = user.role === 'SUPPLIER' ? requireSupplierId(user) : undefined;
    return this.products.getById(id, scope);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createProductSchema)) dto: CreateProductInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.products.create(requireSupplierId(user), dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProductSchema)) dto: UpdateProductInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.products.update(id, requireSupplierId(user), dto);
  }

  /** Tekshiruvga yuborish */
  @Post(':id/submit')
  submit(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.products.submitForReview(id, requireSupplierId(user));
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<void> {
    await this.products.remove(id, requireSupplierId(user));
  }

  /** Admin: tasdiqlash yoki rad etish */
  @Roles('ADMIN', 'STAFF')
  @Post(':id/review')
  review(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(reviewProductSchema)) dto: ReviewProductInput,
    @CurrentUser('sub') userId: string,
    @Req() req: AppRequest,
  ) {
    return this.products.review(id, dto, { userId, ip: req.ip, requestId: req.requestId });
  }
}
