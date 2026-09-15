import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { documentUploadSchema } from '@ecwt/validation';
import type { DocumentDto } from '@ecwt/types';

import { DocumentsService, type UploadedFile as MulterFile } from './documents.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { zodBody } from '../../common/pipes/zod-validation.pipe';
import { MAX_UPLOAD_BYTES } from '@ecwt/config';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'Foydalanuvchi hujjatlari' })
  list(@CurrentUser('sub') userId: string): Promise<DocumentDto[]> {
    return this.service.list(userId);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Hujjat yuklash (PDF/JPG/PNG, maks 10 MB)' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  upload(
    @CurrentUser('sub') userId: string,
    @Body(zodBody(documentUploadSchema)) body: { type: DocumentDto['type'] },
    @UploadedFile() file: MulterFile,
  ): Promise<DocumentDto> {
    return this.service.upload(userId, body.type, file);
  }

  /**
   * Hujjat mazmuni — faqat egasi yoki xodim (REVIEWER va yuqori) ko'ra oladi.
   *
   * Ilgari fayllar `express.static` orqali autentifikatsiyasiz ochiq edi —
   * pasport/selfie kabi hujjatlar URL manzilini bilgan har kim ochishi
   * mumkin edi. Endi har bir so'rov shu yerda tekshiriladi.
   */
  @Get(':id/file')
  @ApiOperation({ summary: 'Hujjat faylini ko‘rish (faqat egasi yoki xodim)' })
  async file(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const doc = await this.service.readFile(id);
    const isOwner = doc.userId === user.sub;
    const isStaff = user.role !== 'USER';
    if (!isOwner && !isStaff) {
      throw new ForbiddenException('Bu hujjatni ko‘rishga ruxsatingiz yo‘q');
    }

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.fileName)}"`);
    res.send(doc.buffer);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Hujjatni o‘chirish' })
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string): Promise<void> {
    return this.service.remove(userId, id);
  }
}
