import { ApiBody } from '@nestjs/swagger';
import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { z } from 'zod';

// Documenta o body a partir do MESMO schema Zod que valida a requisição (sem DTO duplicado)
export function ApiZodBody(schema: z.ZodType) {
  return ApiBody({
    schema: z.toJSONSchema(schema, { target: 'openapi-3.0' }) as SchemaObject,
  });
}
