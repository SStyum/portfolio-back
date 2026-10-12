import serverlessExpress from '@codegenie/serverless-express';
import type { APIGatewayProxyEventV2, Context, Handler } from 'aws-lambda';
import { createApp } from './app.factory';

// Reaproveitado entre invocações enquanto o container da Lambda estiver quente
let server: Handler | undefined

async function bootstrap(): Promise<Handler> {
  const app = await createApp()
  await app.init()

  return serverlessExpress({ app: app.getHttpAdapter().getInstance() })
}

export const handler = async (event: APIGatewayProxyEventV2, context: Context) => {
  server ??= await bootstrap()

  return server(event, context, () => {})
}
