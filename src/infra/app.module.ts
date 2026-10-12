import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { ConfigModule } from '@nestjs/config'
import { envSchema } from './env/env'
import { HttpModule } from './http/http.module'
import { AuthModule } from './auth/auth.module'
import { EventsModule } from './events/events.module'
import { MetricsModule } from './metrics/metrics.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: env => envSchema.parse(env),
      isGlobal: true,
      // Nos testes o ambiente vem só do setup, nunca do .env da máquina
      ignoreEnvFile: process.env.NODE_ENV === 'test',
    }),
    // Rate limit por IP (padrão: 100 req/min). Rotas sensíveis apertam com @Throttle
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
      // Desligável nos testes E2E (dezenas de requisições do mesmo IP)
      skipIf: () => process.env.RATE_LIMIT_DISABLED === 'true',
    }),
    HttpModule,
    AuthModule,
    EventsModule,
    MetricsModule
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})

export class AppModule {}