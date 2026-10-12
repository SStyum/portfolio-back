import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { loadSecrets } from './aws/load-secrets';

// Usado pelo servidor local (main.ts) e pela Lambda (lambda.ts)
export async function createApp() {
  await loadSecrets()

  // Import dinâmico: o AppModule só pode ser carregado depois que os secrets estão no process.env
  const { AppModule } = await import('./app.module')

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug', 'verbose']
  });

  app.enableCors()

  return app
}
