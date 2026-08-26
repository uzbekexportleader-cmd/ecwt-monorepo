import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import {
  createPayoutSchema,
  failPayoutSchema,
  markPayoutPaidSchema,
  payoutListQuerySchema,
  type CreatePayoutInput,
  type FailPayoutInput,
  type JwtPayload,
  type MarkPayoutPaidInput,
  type PayoutListQuery,
} from '@ecwt/contracts';
import { PayoutsService } from './payouts.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, Roles } from '../../common/decorators';
import { requireSupplierId } from '../../common/require-supplier';
import type { AppRequest } from '../../common/types';

@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payouts: PayoutsService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(payoutListQuerySchema)) query: PayoutListQuery,
    @CurrentUser() user: JwtPayload,
  ) {
    const scope = user.role === 'SUPPLIER' ? requireSupplierId(user) : undefined;
    return this.payouts.list(query, scope);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const scope = user.role === 'SUPPLIER' ? requireSupplierId(user) : undefined;
    return this.payouts.getById(id, scope);
  }

  /** Admin: hamkorga to'lanishi kerak bo'lgan buyurtmalar ro'yxati */
  @Roles('ADMIN', 'STAFF')
  @Get('payable/:supplierId')
  payable(@Param('supplierId') supplierId: string) {
    return this.payouts.payableOrders(supplierId);
  }

  @Roles('ADMIN')
  @Post()
  create(
    @Body(new ZodValidationPipe(createPayoutSchema)) dto: CreatePayoutInput,
    @CurrentUser('sub') userId: string,
    @Req() req: AppRequest,
  ) {
    return this.payouts.create(dto, { userId, ip: req.ip, requestId: req.requestId });
  }

  @Roles('ADMIN')
  @Post(':id/processing')
  startProcessing(@Param('id') id: string) {
    return this.payouts.startProcessing(id);
  }

  @Roles('ADMIN')
  @Post(':id/paid')
  markPaid(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(markPayoutPaidSchema)) dto: MarkPayoutPaidInput,
    @CurrentUser('sub') userId: string,
    @Req() req: AppRequest,
  ) {
    return this.payouts.markPaid(id, dto, { userId, ip: req.ip, requestId: req.requestId });
  }

  @Roles('ADMIN')
  @Post(':id/failed')
  markFailed(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(failPayoutSchema)) dto: FailPayoutInput,
    @CurrentUser('sub') userId: string,
    @Req() req: AppRequest,
  ) {
    return this.payouts.markFailed(id, dto, { userId, ip: req.ip, requestId: req.requestId });
  }

  @Roles('ADMIN')
  @Post(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser('sub') userId: string, @Req() req: AppRequest) {
    return this.payouts.cancel(id, { userId, ip: req.ip, requestId: req.requestId });
  }
}
