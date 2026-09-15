import { Module } from '@nestjs/common';

import { ContractController } from './contract.controller';
import { ContractService } from './contract.service';
import { ESignatureProvider } from './e-signature.provider';
import { ENV, type Env } from '../../config/env';

/**
 * Onlayn shartnoma: shablon, to'ldirish va imzo holati.
 *
 * Mavjud `contracts` moduli (PDF namunasini berish) o'z joyida qoladi —
 * u boshqa vazifani bajaradi.
 */
@Module({
  controllers: [ContractController],
  providers: [
    ContractService,
    {
      provide: ESignatureProvider,
      inject: [ENV],
      useFactory: (env: Env) => new ESignatureProvider(env),
    },
  ],
  exports: [ContractService],
})
export class ContractModule {}
