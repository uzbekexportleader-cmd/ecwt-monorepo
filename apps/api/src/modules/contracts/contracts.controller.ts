import { Controller, Get, Inject, Res, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { basename } from 'node:path';

import { Public } from '../../common/decorators/public.decorator';
import { ENV, type Env } from '../../config/env';

/**
 * ECWT shartnoma namunasi.
 *
 * MUHIM: shartnoma matni ilova ichida yaratilmaydi. Bu huquqiy hujjat —
 * uni kompaniya yuridik bo'limi tayyorlaydi. Fayl `CONTRACT_TEMPLATE_PATH`
 * orqali ko'rsatiladi; ko'rsatilmagan bo'lsa endpoint ochiq xato qaytaradi
 * va ilovada "shartnoma namunasi hali yuklanmagan" deb yoziladi.
 */
@ApiTags('contracts')
@Controller('contracts')
export class ContractsController {
  constructor(@Inject(ENV) private readonly env: Env) {}

  @Public()
  @Get('template')
  @ApiOperation({ summary: 'Shartnoma namunasini yuklab olish' })
  download(@Res() res: Response): void {
    const path = this.env.CONTRACT_TEMPLATE_PATH;

    if (!path || !existsSync(path) || !statSync(path).isFile()) {
      throw new ServiceUnavailableException(
        'Shartnoma namunasi hali yuklanmagan. ECWT mutaxassisi bilan bog‘laning.',
      );
    }

    const name = basename(path);
    res.setHeader('Content-Type', name.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    createReadStream(path).pipe(res);
  }
}
