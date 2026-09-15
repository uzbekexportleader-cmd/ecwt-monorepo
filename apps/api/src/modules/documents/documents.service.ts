import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ALLOWED_UPLOAD_MIME, MAX_UPLOAD_BYTES } from '@ecwt/config';
import type { DocumentDto, DocumentType } from '@ecwt/types';

import { PrismaService } from '../../prisma/prisma.service';
import { STORAGE_PROVIDER, type StorageProvider } from '../storage/storage.provider';
import { AuditService } from '../../common/audit/audit.service';

export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  async list(userId: string): Promise<DocumentDto[]> {
    const docs = await this.prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return docs.map((d) => this.toDto(d));
  }

  async upload(userId: string, type: DocumentType, file?: UploadedFile): Promise<DocumentDto> {
    if (!file) throw new BadRequestException('Fayl yuklanmadi');

    if (!ALLOWED_UPLOAD_MIME.includes(file.mimetype as (typeof ALLOWED_UPLOAD_MIME)[number])) {
      throw new BadRequestException('Faqat PDF, JPG yoki PNG fayl yuklash mumkin');
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new BadRequestException(`Fayl hajmi ${MAX_UPLOAD_BYTES / 1024 / 1024} MB dan oshmasligi kerak`);
    }
    if (!isMagicValid(file.buffer, file.mimetype)) {
      throw new BadRequestException('Fayl mazmuni turiga mos emas');
    }

    const stored = await this.storage.save(
      { buffer: file.buffer, originalName: file.originalname, mimeType: file.mimetype },
      `documents/${userId}`,
    );

    const doc = await this.prisma.document.create({
      data: {
        userId,
        type,
        fileName: file.originalname,
        storageKey: stored.key,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
    });

    await this.audit.record({
      actorId: userId,
      action: 'document.upload',
      entity: 'Document',
      entityId: doc.id,
      metadata: { type, sizeBytes: file.size },
    });

    return this.toDto(doc);
  }

  /**
   * Hujjat mazmunini o'qiydi — faqat egasi yoki xodim (REVIEWER+) kira oladi.
   * Ruxsat tekshiruvi controller darajasida (`assertReadable`) amalga oshadi.
   */
  async readFile(id: string): Promise<{ buffer: Buffer; mimeType: string; fileName: string; userId: string }> {
    const doc = await this.prisma.document.findFirst({ where: { id } });
    if (!doc) throw new NotFoundException('Hujjat topilmadi');
    const buffer = await this.storage.read(doc.storageKey);
    return { buffer, mimeType: doc.mimeType, fileName: doc.fileName, userId: doc.userId };
  }

  async remove(userId: string, id: string): Promise<void> {
    const doc = await this.prisma.document.findFirst({ where: { id, userId } });
    if (!doc) throw new NotFoundException('Hujjat topilmadi');

    const linked = await this.prisma.applicationDocument.count({
      where: { documentId: id, application: { status: { notIn: ['DRAFT', 'CANCELLED', 'REJECTED'] } } },
    });
    if (linked > 0) {
      throw new BadRequestException('Bu hujjat ko‘rib chiqilayotgan arizaga biriktirilgan — o‘chirib bo‘lmaydi');
    }

    await this.storage.remove(doc.storageKey);
    await this.prisma.document.delete({ where: { id } });
    await this.audit.record({ actorId: userId, action: 'document.delete', entity: 'Document', entityId: id });
  }

  toDto(doc: {
    id: string;
    type: DocumentType;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    verified: boolean;
    createdAt: Date;
  }): DocumentDto {
    return {
      id: doc.id,
      type: doc.type,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      url: `/api/documents/${doc.id}/file`,
      verified: doc.verified,
      createdAt: doc.createdAt.toISOString(),
    };
  }
}

/** MIME turini fayl imzosi (magic bytes) bilan solishtirish. */
function isMagicValid(buffer: Buffer, mime: string): boolean {
  if (buffer.length < 4) return false;
  const hex = buffer.subarray(0, 4).toString('hex').toUpperCase();
  switch (mime) {
    case 'application/pdf':
      return hex.startsWith('25504446'); // %PDF
    case 'image/jpeg':
      return hex.startsWith('FFD8FF');
    case 'image/png':
      return hex.startsWith('89504E47');
    default:
      return false;
  }
}
