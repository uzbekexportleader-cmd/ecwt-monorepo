import { Module } from '@nestjs/common';
import { ENV, type Env } from '../../config/env';
import { REGISTRY_PROVIDER, type GovernmentRegistryProvider } from './registry.provider';
import { MockGovernmentRegistryProvider } from './mock-registry.provider';
import { RealGovernmentRegistryProvider } from './real-registry.provider';

@Module({
  providers: [
    {
      provide: REGISTRY_PROVIDER,
      inject: [ENV],
      useFactory: (env: Env): GovernmentRegistryProvider =>
        env.REGISTRY_PROVIDER === 'real'
          ? new RealGovernmentRegistryProvider(env)
          : new MockGovernmentRegistryProvider(),
    },
  ],
  exports: [REGISTRY_PROVIDER],
})
export class RegistryModule {}
