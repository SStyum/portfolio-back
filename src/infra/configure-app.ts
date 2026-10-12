import type { NestExpressApplication } from '@nestjs/platform-express';
import { httpMetricsMiddleware } from './metrics/http-metrics.middleware';
import { setupSwagger } from './http/swagger/setup-swagger';

// Configuração comum da app HTTP: usada pelo servidor, pela Lambda e pelos testes E2E
export function configureApp(app: NestExpressApplication) {
  // 1 proxy na frente (API Gateway): req.ip vira o IP real do cliente, usado no rate limit
  app.set('trust proxy', 1)

  app.enableCors()
  app.use(httpMetricsMiddleware)
  setupSwagger(app)

  return app
}
