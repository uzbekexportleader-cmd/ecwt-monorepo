// Sentry hamma narsadan oldin — instrumentatsiya modullar yuklanishidan
// avval yoqilishi kerak
import './instrument';

import 'reflect-metadata';
import 'dotenv/config';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { corsOrigins, loadEnv } from './config/env';

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: env.NODE_ENV === 'production' ? ['error', 'warn', 'log'] : ['error', 'warn', 'log', 'debug'],
  });

  app.use(helmet());
  app.enableCors({
    origin: env.NODE_ENV === 'production' ? corsOrigins(env) : true,
    credentials: true,
  });
  app.setGlobalPrefix('api');
  // Validatsiya Zod sxemalari orqali (@ecwt/validation) — class-validator ishlatilmaydi

  // MUHIM: yuklangan fayllar (pasport, selfie, shartnoma) statik papka sifatida
  // ochilmaydi — har biri autentifikatsiya va egalik tekshiruvidan o'tadi.
  // Qarang: documents.controller.ts `GET /documents/:id/file`.

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ECWT API')
    .setDescription(
      'ECWT — hunarmandlar uchun subsidiya va marketplace platformasi. ' +
        'Demo ma’lumotlar real huquqiy hujjat sifatida qabul qilinmasligi kerak.',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(env.PORT, '0.0.0.0');

  logger.log(`ECWT API: http://localhost:${env.PORT}/api`);
  logger.log(`Swagger:  http://localhost:${env.PORT}/api/docs`);
  logger.log(
    `Provayderlar → SMS: ${env.SMS_PROVIDER}, OneID: ${env.IDENTITY_PROVIDER}, ` +
      `E-IMZO: ${env.SIGNATURE_PROVIDER}, Reyestr: ${env.REGISTRY_PROVIDER}, ` +
      `Marketplace: ${env.MARKETPLACE_PROVIDER}, AI: ${env.AI_PROVIDER}, ` +
      `Telegram: ${env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID ? 'ulangan' : 'mock'}`,
  );
  if (env.EXPOSE_DEV_OTP && env.NODE_ENV !== 'production') {
    logger.warn('EXPOSE_DEV_OTP yoqilgan — OTP kodi API javobida qaytadi (faqat development uchun)');
  }
}

void bootstrap();
