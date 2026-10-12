import { createApp } from './app.factory';
import { EnvService } from './env/env.service';

async function bootstrap() {
  const app = await createApp()

  const envService = app.get(EnvService)
  const port = envService.get('PORT')

  await app.listen(port);
}
bootstrap(); // Inicializa a aplicação
