import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.useStaticAssets(join(process.cwd(), 'public'), {
    maxAge: '1h',
  });

  const port = Number.parseInt(process.env.PORT ?? '3013', 10);
  await app.listen(Number.isFinite(port) ? port : 3013, '0.0.0.0');
}

void bootstrap();
