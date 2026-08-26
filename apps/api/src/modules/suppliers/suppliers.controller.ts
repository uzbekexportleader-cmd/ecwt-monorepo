import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import {
  reviewSupplierSchema,
  supplierListQuerySchema,
  updateSupplierSchema,
  type JwtPayload,
  type ReviewSupplierInput,
  type SupplierListQuery,
  type UpdateSupplierInput,
} from '@ecwt/contracts';
import { SuppliersService } from './suppliers.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, Roles } from '../../common/decorators';
import { requireSupplierId } from '../../common/require-supplier';
import type { AppRequest } from '../../common/types';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}

  // ---------------------------------------------------------------- hamkor

  /** O'z profilim */
  @Get('me')
  getMine(@CurrentUser() user: JwtPayload) {
    return this.suppliers.getById(requireSupplierId(user), true);
  }

  @Patch('me')
  updateMine(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(updateSupplierSchema)) dto: UpdateSupplierInput,
  ) {
    return this.suppliers.update(requireSupplierId(user), dto);
  }

  /** Profilni tekshiruvga yuborish */
  @Post('me/submit')
  submit(@CurrentUser() user: JwtPayload) {
    return this.suppliers.submitForReview(requireSupplierId(user));
  }

  /** Kabinet bosh sahifasidagi raqamlar */
  @Get('me/stats')
  stats(@CurrentUser() user: JwtPayload) {
    return this.suppliers.getStats(requireSupplierId(user));
  }

  // ----------------------------------------------------------------- admin

  @Roles('ADMIN', 'STAFF')
  @Get()
  list(@Query(new ZodValidationPipe(supplierListQuerySchema)) query: SupplierListQuery) {
    return this.suppliers.list(query);
  }

  @Roles('ADMIN', 'STAFF')
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.suppliers.getById(id, true);
  }

  @Roles('ADMIN', 'STAFF')
  @Get(':id/stats')
  statsFor(@Param('id') id: string) {
    return this.suppliers.getStats(id);
  }

  /** Tasdiqlash / rad etish / to'xtatish — faqat ADMIN */
  @Roles('ADMIN')
  @Post(':id/review')
  review(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(reviewSupplierSchema)) dto: ReviewSupplierInput,
    @CurrentUser('sub') userId: string,
    @Req() req: AppRequest,
  ) {
    return this.suppliers.review(id, dto, {
      userId,
      ip: req.ip,
      requestId: req.requestId,
    });
  }
}
