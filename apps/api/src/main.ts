import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { splitOrigins, type Env } from './config/env';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    // Webhook imzosini tekshirish uchun xom tana kerak
    rawBody: true,
    bufferLogs: true,
  });

  const config = app.get(ConfigService<Env, true>);

  app.setGlobalPrefix('api');

  // Xavfsizlik sarlavhalari. API JSON qaytaradi, HTML emas —
  // shuning uchun CSP kerak emas.
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));

  const origins = splitOrigins(config.get<string>('CORS_ORIGINS') ?? '');
  app.enableCors({
    origin: origins,
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Idempotency-Key',
      'X-Device-Id',
      'X-Request-Id',
    ],
    exposedHeaders: ['X-Request-Id'],
  });

  // Global ValidationPipe qo'yilmagan: butun validatsiya zod sxemalari orqali
  // ZodValidationPipe'da bo'ladi. Zod noma'lum maydonlarni o'zi tashlab
  // yuboradi, ya'ni class-validator qo'shishdan foyda yo'q.

  app.enableShutdownHooks();

  const port = config.get<number>('PORT') ?? 4000;
  await app.listen(port, '0.0.0.0');

  logger.log(`ECWT API ishga tushdi: http://localhost:${port}/api`);
  logger.log(`Ruxsat etilgan manbalar (CORS): ${origins.join(', ')}`);
}

bootstrap().catch((error: unknown) => {
  // Ishga tushishdagi xato (masalan .env to'liq emas) aniq ko'rinishi kerak.
  // Emoji ishlatilmaydi — Windows konsolida buzilib chiqadi.
  const message = error instanceof Error ? error.message : String(error);
  // eslint-disable-next-line no-console
  console.error(`\n[XATO] Server ishga tushmadi:\n${message}\n`);
  process.exit(1);
});
