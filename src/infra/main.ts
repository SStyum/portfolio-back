import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvService } from './env/env.service';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger:['error', 'warn', 'debug', 'verbose']
  });

  app.enableCors()

  const configService = app.get(ConfigService);
  
  const envService = app.get(EnvService)
  const port = envService.get('PORT') || 3333 || process.env.PORT!
  

  await app.listen(port);
}
bootstrap(); // Inicializa a aplicação

