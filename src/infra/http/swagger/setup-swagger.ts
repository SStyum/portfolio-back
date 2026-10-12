import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_BEARER = 'access-token';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Playground de Engenheiro — API')
    .setDescription('API do Playground de Engenheiro: contas, blog, chat com IA, assinatura e pagamentos.')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, SWAGGER_BEARER)
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // UI em /docs e o JSON em /docs-json
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs-json',
    swaggerOptions: { persistAuthorization: true },
  });
}
