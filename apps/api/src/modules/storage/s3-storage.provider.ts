import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { StorageProvider, StoredFile } from './storage.provider';
import type { Env } from '../../config/env';

/**
 * S3-mos storage adapteri karkasi (MinIO / AWS S3 / Cloudflare R2).
 *
 * Real ishga tushirish uchun `@aws-sdk/client-s3` paketi va credential kerak.
 * Credential yo'q ekan — xato qaytaradi, "ishladi" deb ko'rsatmaydi.
 */
@Injectable()
export class S3StorageProvider implements StorageProvider {
  readonly name = 's3';

  constructor(private readonly env: Env) {}

  private assertConfigured(): never | void {
    const { S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = this.env;
    if (!S3_ENDPOINT || !S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
      throw new ServiceUnavailableException(
        'S3 storage sozlanmagan: S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY kerak',
      );
    }
  }

  async save(): Promise<StoredFile> {
    this.assertConfigured();
    throw new ServiceUnavailableException(
      'S3 adapteri hali implement qilinmagan: @aws-sdk/client-s3 ni qo‘shing va shu metodni to‘ldiring',
    );
  }

  async remove(): Promise<void> {
    this.assertConfigured();
    throw new ServiceUnavailableException('S3 adapteri hali implement qilinmagan');
  }

  async read(): Promise<Buffer> {
    this.assertConfigured();
    throw new ServiceUnavailableException('S3 adapteri hali implement qilinmagan');
  }
}
