import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { loadSecrets } from './aws/load-secrets';
import { configureApp } from './configure-app';

// Usado pelo servidor local (main.ts) e pela Lambda (lambda.ts)
export async function createApp() {
  await loadSecrets()

  // Import dinâmico: o AppModule só pode ser carregado depois que os secrets estão no process.env
  const { AppModule } = await import('./app.module')

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    // Webhooks validam a assinatura sobre o body cru (req.rawBody)
    rawBody: true,
  });

  return configureApp(app)
}
