import { createHash } from 'node:crypto';

import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { ContractDto, ContractPreviewDto, ContractStatus } from '@ecwt/types';

import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { ESignatureProvider } from './e-signature.provider';
import {
  CONTRACT_FIELDS,
  SYSTEM_PLACEHOLDERS,
  extractPlaceholders,
  fillTemplate,
} from './contract-fields';

/**
 * Shartnoma: shablon + hunarmand ma'lumoti → to'ldirilgan matn.
 *
 * Shablon bazada versiyalanadi. Shartnoma o'zgarganda yangi versiya
 * qo'shiladi; allaqachon tuzilgan shartnomalar o'sha paytdagi matnni
 * saqlab qoladi (`filledBody` nusxasi).
 */

const NUMBER_PREFIX = 'ECWT-SH';
const NUMBER_RETRIES = 5;

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly eSignature: ESignatureProvider,
  ) {}

  /* ------------------------------ shablon ------------------------------- */

  /**
   * Yangi versiya qo'shadi va uni faol qiladi.
   *
   * Eski versiya o'chirilmaydi: imzolangan shartnomalar unga bog'langan.
   */
  async saveTemplate(title: string, body: string, actorId: string) {
    const last = await this.prisma.contractTemplate.findFirst({ orderBy: { version: 'desc' } });
    const version = (last?.version ?? 0) + 1;

    const created = await this.prisma.$transaction(async (tx) => {
      await tx.contractTemplate.updateMany({ where: { isActive: true }, data: { isActive: false } });
      return tx.contractTemplate.create({
        data: { version, title, body, isActive: true, createdById: actorId },
      });
    });

    await this.audit.record({
      actorId,
      action: 'contract.template.save',
      entity: 'ContractTemplate',
      entityId: created.id,
      metadata: { version },
    });

    return {
      version: created.version,
      title: created.title,
      isActive: created.isActive,
      /*
       * Shablonda ishlatilgan, lekin tizim bilmaydigan o'rin egallar —
       * ular to'ldirilmay qoladi, shuning uchun darhol aytiladi.
       */
      unknownPlaceholders: extractPlaceholders(created.body).filter(
        (key) => !CONTRACT_FIELDS.some((f) => f.key === key) && !SYSTEM_PLACEHOLDERS.includes(key),
      ),
      createdAt: created.createdAt.toISOString(),
    };
  }

  async listTemplates() {
    const rows = await this.prisma.contractTemplate.findMany({ orderBy: { version: 'desc' } });
    return rows.map((r) => ({
      version: r.version,
      title: r.title,
      isActive: r.isActive,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /* ----------------------------- to'ldirish ----------------------------- */

  /** Shartnoma matni va yetishmayotgan maydonlar */
  async preview(userId: string): Promise<ContractPreviewDto> {
    const template = await this.prisma.contractTemplate.findFirst({ where: { isActive: true } });
    const existing = await this.prisma.userContract.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { template: { select: { version: true } } },
    });

    if (!template) {
      // Shablon hali yuklanmagan — bu xato emas, shunchaki hali yo'q
      return {
        templateVersion: null,
        title: null,
        body: null,
        placeholders: [],
        missing: [],
        ready: false,
        contract: existing ? this.toDto(existing, existing.template.version) : null,
        eSignatureReady: this.eSignature.isConfigured,
      };
    }

    const { values, placeholders } = await this.collect(userId);
    const used = extractPlaceholders(template.body);

    const missing = placeholders
      .filter((p) => used.includes(p.key) && !p.value)
      .filter((p) => CONTRACT_FIELDS.find((f) => f.key === p.key)?.required)
      .map((p) => p.label);

    return {
      templateVersion: template.version,
      title: template.title,
      body: fillTemplate(template.body, values),
      placeholders: placeholders.filter((p) => used.includes(p.key)),
      missing,
      ready: missing.length === 0,
      contract: existing ? this.toDto(existing, existing.template.version) : null,
      eSignatureReady: this.eSignature.isConfigured,
    };
  }

  private async collect(userId: string) {
    const profile = await this.prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profil topilmadi');
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { phone: true },
    });

    const source = { ...profile, loginPhone: user.phone };
    const values = new Map<string, string | null>();
    const placeholders = CONTRACT_FIELDS.map((field) => {
      const value = field.value(source);
      values.set(field.key, value);
      return { key: field.key, label: field.label, value, fixRoute: field.fixRoute };
    });

    return { values, placeholders };
  }

  /* ---------------------------- shartnomalar ---------------------------- */

  /**
   * Shartnoma tuzadi.
   *
   * Matn nusxasi saqlanadi — shablon keyin o'zgarsa ham, bu shartnoma
   * o'zgarmaydi.
   */
  async create(userId: string): Promise<ContractDto> {
    const template = await this.prisma.contractTemplate.findFirst({ where: { isActive: true } });
    if (!template) throw new BadRequestException('Shartnoma shabloni hali yuklanmagan');

    const preview = await this.preview(userId);
    if (!preview.ready) {
      throw new BadRequestException(
        `Shartnoma uchun ma’lumot yetishmayapti: ${preview.missing.join(', ')}`,
      );
    }

    // Imzolanmagan eski qoralama bo'lsa, uni qayta ishlatamiz
    const draft = await this.prisma.userContract.findFirst({
      where: { userId, status: 'DRAFT' },
      orderBy: { createdAt: 'desc' },
    });

    if (draft) {
      const updated = await this.prisma.userContract.update({
        where: { id: draft.id },
        data: { templateId: template.id, filledBody: preview.body as string },
      });
      return this.toDto(updated, template.version);
    }

    const created = await this.createWithNumber(userId, template.id, preview.body as string);

    await this.audit.record({
      actorId: userId,
      action: 'contract.create',
      entity: 'UserContract',
      entityId: created.id,
      metadata: { templateVersion: template.version },
    });

    return this.toDto(created, template.version);
  }

  /** Raqam to'qnashuvida keyingisini oladi */
  private async createWithNumber(userId: string, templateId: string, filledBody: string) {
    const year = new Date().getFullYear();

    for (let attempt = 0; attempt < NUMBER_RETRIES; attempt++) {
      const count = await this.prisma.userContract.count();
      const number = `${NUMBER_PREFIX}-${year}-${String(count + 1 + attempt).padStart(6, '0')}`;
      try {
        return await this.prisma.userContract.create({
          data: {
            userId,
            templateId,
            /*
             * Raqam faqat shu yerda ma'lum bo'ladi (yozuv yaratilgach),
             * shuning uchun matnga ham shu paytda qo'yiladi.
             */
            filledBody: filledBody.replace(/\{\{\s*contractNumber\s*\}\}/g, number),
            number,
            status: 'DRAFT',
          },
        });
      } catch (err) {
        const isUniqueViolation =
          typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002';
        if (!isUniqueViolation || attempt === NUMBER_RETRIES - 1) throw err;
      }
    }
    throw new Error('Shartnoma raqamini yaratib bo‘lmadi');
  }

  /**
   * Hunarmand shartnomani ilovada tasdiqlaydi.
   *
   * Bu — shaxsning O'Z harakati: u matnni o'qib, "Tasdiqlayman" tugmasini
   * bosadi. Tasdiqlangan MATNNING barmoq izi (SHA-256) saqlanadi, shuning
   * uchun keyin "men boshqa matnni ko'rgandim" degan savol tug'ilmaydi.
   *
   * Bu elektron imzo EMAS: e-imzo tizimi ulanganda huquqiy imzo shu
   * yozuv ustiga qo'shiladi.
   */
  async accept(userId: string, ip: string | null): Promise<ContractDto> {
    const contract = await this.prisma.userContract.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { template: { select: { version: true } } },
    });
    if (!contract) throw new NotFoundException('Shartnoma topilmadi');
    if (contract.status !== 'DRAFT') {
      // Takroriy tasdiq yozuvni o'zgartirmaydi
      return this.toDto(contract, contract.template.version);
    }

    const updated = await this.prisma.userContract.update({
      where: { id: contract.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        acceptedIp: ip,
        acceptedHash: createHash('sha256').update(contract.filledBody, 'utf8').digest('hex'),
      },
    });

    await this.audit.record({
      actorId: userId,
      action: 'contract.accept',
      entity: 'UserContract',
      entityId: contract.id,
      ip: ip ?? undefined,
    });

    return this.toDto(updated, contract.template.version);
  }

  /**
   * Imzoga yuborish.
   *
   * E-imzo tizimi ulanmagan bo'lsa holat O'ZGARMAYDI va shu haqda ochiq
   * aytiladi — "yuborildi" deb ko'rsatib, hech qayerga bormagan
   * shartnomani kutdirish eng yomon variant.
   */
  async sendForSigning(userId: string): Promise<ContractDto> {
    const contract = await this.prisma.userContract.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { template: { select: { version: true } } },
    });
    if (!contract) throw new NotFoundException('Shartnoma topilmadi');
    if (contract.status === 'SIGNED') return this.toDto(contract, contract.template.version);
    if (contract.status === 'DRAFT') {
      throw new BadRequestException('Avval shartnomani o‘qib, tasdiqlang');
    }

    const result = await this.eSignature.sendForSigning();
    if (result.status !== 'SENT') {
      throw new BadRequestException(result.message ?? 'Elektron imzo tizimi mavjud emas');
    }

    const updated = await this.prisma.userContract.update({
      where: { id: contract.id },
      data: {
        status: 'SENT_FOR_SIGNING',
        externalProvider: 'didox',
        externalId: result.externalId,
        externalUrl: result.externalUrl,
        sentAt: new Date(),
      },
    });
    return this.toDto(updated, contract.template.version);
  }

  /**
   * Imzolangan nusxani qayd etish.
   *
   * Ikki yo'l: e-imzo tizimidan tasdiq keladi yoki operator imzolangan
   * faylni ko'rib belgilaydi. Foydalanuvchining o'zi "imzolandi" deb
   * qo'ya olmaydi.
   */
  async markSigned(userId: string, documentId: string | null, actorId: string): Promise<ContractDto> {
    const contract = await this.prisma.userContract.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { template: { select: { version: true } } },
    });
    if (!contract) throw new NotFoundException('Shartnoma topilmadi');

    const updated = await this.prisma.userContract.update({
      where: { id: contract.id },
      data: { status: 'SIGNED', signedDocumentId: documentId, signedAt: new Date() },
    });

    // Profildagi belgini ham yangilaymiz — anketa shu qiymatga qaraydi
    await this.prisma.artisanProfile
      .update({ where: { userId }, data: { contractSignedAt: new Date() } })
      .catch((err: Error) => this.logger.warn(`Profil belgisi: ${err.message}`));

    await this.audit.record({
      actorId,
      action: 'contract.signed',
      entity: 'UserContract',
      entityId: contract.id,
    });

    return this.toDto(updated, contract.template.version);
  }

  private toDto(
    row: {
      id: string;
      number: string;
      status: ContractStatus;
      filledBody: string;
      externalUrl: string | null;
      acceptedAt?: Date | null;
      sentAt: Date | null;
      signedAt: Date | null;
      note: string | null;
      createdAt: Date;
    },
    templateVersion: number,
  ): ContractDto {
    return {
      id: row.id,
      number: row.number,
      status: row.status,
      body: row.filledBody,
      templateVersion,
      externalUrl: row.externalUrl,
      acceptedAt: row.acceptedAt?.toISOString() ?? null,
      sentAt: row.sentAt?.toISOString() ?? null,
      signedAt: row.signedAt?.toISOString() ?? null,
      note: row.note,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
