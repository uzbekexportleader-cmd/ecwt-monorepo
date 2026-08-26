import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import {
  createPaymentSchema,
  paymentListQuerySchema,
  type CreatePaymentInput,
  type JwtPayload,
  type PaymentListQuery,
} from '@ecwt/contracts';
import { PaymentsService } from './payments.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../common/decorators';
import { requireSupplierId } from '../../common/require-supplier';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /** Qaysi to'lov tizimlari ulangan — klient shu ro'yxatni ko'rsatadi */
  @Get('providers')
  providers() {
    return this.payments.availableProviders();
  }

  @Get()
  list(
    @Query(new ZodValidationPipe(paymentListQuerySchema)) query: PaymentListQuery,
    @CurrentUser() user: JwtPayload,
  ) {
    const scope = user.role === 'SUPPLIER' ? requireSupplierId(user) : undefined;
    return this.payments.list(query, scope);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const scope = user.role === 'SUPPLIER' ? requireSupplierId(user) : undefined;
    return this.payments.getById(id, scope);
  }

  /**
   * To'lov yaratish.
   *
   * Klient `Idempotency-Key` sarlavhasini yuborishi tavsiya etiladi:
   * tarmoq uzilib, so'rov takrorlansa ikkinchi to'lov yaratilmaydi.
   */
  @Post()
  create(
    @Body(new ZodValidationPipe(createPaymentSchema)) dto: CreatePaymentInput,
    @CurrentUser() user: JwtPayload,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.payments.create(requireSupplierId(user), dto, idempotencyKey);
  }
}
