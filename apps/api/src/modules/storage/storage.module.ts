import { Module } from '@nestjs/common';
import { ENV, type Env } from '../../config/env';
import { STORAGE_PROVIDER, type StorageProvider } from './storage.provider';
import { LocalStorageProvider } from './local-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';

@Module({
  providers: [
    {
      provide: STORAGE_PROVIDER,
      inject: [ENV],
      useFactory: (env: Env): StorageProvider =>
        env.STORAGE_DRIVER === 's3' ? new S3StorageProvider(env) : new LocalStorageProvider(env),
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
