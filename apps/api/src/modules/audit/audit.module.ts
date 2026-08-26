import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';

/**
 * Global — deyarli har bir domen moduli audit yozuvi qoldiradi,
 * har birida alohida import qilib o'tirmaslik uchun.
 */
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
