import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { z } from 'zod';
import {
  createOrderSchema,
  orderListQuerySchema,
  updateOrderStatusSchema,
  type CreateOrderInput,
  type JwtPayload,
  type OrderListQuery,
  type UpdateOrderStatusInput,
} from '@ecwt/contracts';
import { OrdersService } from './orders.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, Roles } from '../../common/decorators';
import { requireSupplierId } from '../../common/require-supplier';
import type { AppRequest } from '../../common/types';

const summaryQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  supplierId: z.string().optional(),
});

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(orderListQuerySchema)) query: OrderListQuery,
    @CurrentUser() user: JwtPayload,
  ) {
    const scope = user.role === 'SUPPLIER' ? requireSupplierId(user) : undefined;
    return this.orders.list(query, scope);
  }

  /** Sotuv statistikasi — kabinet bosh sahifasidagi grafik uchun */
  @Get('summary')
  summary(
    @Query(new ZodValidationPipe(summaryQuerySchema)) query: z.infer<typeof summaryQuerySchema>,
    @CurrentUser() user: JwtPayload,
  ) {
    const scope = user.role === 'SUPPLIER' ? requireSupplierId(user) : query.supplierId;
    return this.orders.summary(scope, { from: query.from, to: query.to });
  }

  @Get(':id')
  getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const scope = user.role === 'SUPPLIER' ? requireSupplierId(user) : undefined;
    return this.orders.getById(id, scope);
  }

  /** Buyurtmani kiritish — marketplace'dan import qiladigan ECWT xodimi */
  @Roles('ADMIN', 'STAFF')
  @Post()
  create(
    @Body(new ZodValidationPipe(createOrderSchema)) dto: CreateOrderInput,
    @CurrentUser('sub') userId: string,
    @Req() req: AppRequest,
  ) {
    return this.orders.create(dto, { userId, ip: req.ip, requestId: req.requestId });
  }

  @Roles('ADMIN', 'STAFF')
  @Post(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateOrderStatusSchema)) dto: UpdateOrderStatusInput,
    @CurrentUser('sub') userId: string,
    @Req() req: AppRequest,
  ) {
    return this.orders.updateStatus(id, dto, { userId, ip: req.ip, requestId: req.requestId });
  }
}
