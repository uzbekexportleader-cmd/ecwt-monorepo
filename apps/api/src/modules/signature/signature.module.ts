import { Module } from '@nestjs/common';
import { ENV, type Env } from '../../config/env';
import { SIGNATURE_PROVIDER, type DigitalSignatureProvider } from './signature.provider';
import { MockSignatureProvider } from './mock-signature.provider';
import { EImzoSignatureProvider } from './eimzo-signature.provider';

@Module({
  providers: [
    {
      provide: SIGNATURE_PROVIDER,
      inject: [ENV],
      useFactory: (env: Env): DigitalSignatureProvider =>
        env.SIGNATURE_PROVIDER === 'eimzo' ? new EImzoSignatureProvider(env) : new MockSignatureProvider(),
    },
  ],
  exports: [SIGNATURE_PROVIDER],
})
export class SignatureModule {}
