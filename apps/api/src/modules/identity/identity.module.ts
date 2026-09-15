import { Module } from '@nestjs/common';
import { ENV, type Env } from '../../config/env';
import { IDENTITY_PROVIDER, type IdentityProvider } from './identity.provider';
import { MockIdentityProvider } from './mock-identity.provider';
import { OneIdIdentityProvider } from './oneid-identity.provider';

@Module({
  providers: [
    {
      provide: IDENTITY_PROVIDER,
      inject: [ENV],
      useFactory: (env: Env): IdentityProvider =>
        env.IDENTITY_PROVIDER === 'oneid' ? new OneIdIdentityProvider(env) : new MockIdentityProvider(),
    },
  ],
  exports: [IDENTITY_PROVIDER],
})
export class IdentityModule {}
