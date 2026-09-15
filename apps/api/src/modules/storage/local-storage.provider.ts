import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import type { StorageProvider, StoredFile } from './storage.provider';
import type { Env } from '../../config/env';

/** Development uchun lokal disk. Productionda S3 ishlatiladi. */
@Injectable()
export class LocalStorageProvider implements StorageProvider {
  readonly name = 'local';
  private readonly root: string;

  constructor(private readonly env: Env) {
    this.root = resolve(process.cwd(), env.UPLOAD_DIR);
  }

  async save(
    file: { buffer: Buffer; originalName: string; mimeType: string },
    folder: string,
  ): Promise<StoredFile> {
    const dir = join(this.root, folder);
    await mkdir(dir, { recursive: true });
    const ext = extname(file.originalName) || '';
    const key = `${folder}/${randomUUID()}${ext}`;
    await writeFile(join(this.root, key), file.buffer);
    return {
      key,
      sizeBytes: file.buffer.byteLength,
      mimeType: file.mimeType,
      originalName: file.originalName,
    };
  }

  async remove(key: string): Promise<void> {
    await unlink(join(this.root, key)).catch(() => undefined);
  }

  async read(key: string): Promise<Buffer> {
    return readFile(join(this.root, key));
  }
}
