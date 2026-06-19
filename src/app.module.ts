import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { envSchema } from './infra/env/env'
import { PrismaService } from './infra/database/prisma/prisma.service'

@Module({
  imports: [ConfigModule.forRoot({
    validate: env => envSchema.parse(env),
    isGlobal: true
  })],
  controllers: [],
  providers: [PrismaService],
})

export class AppModule {}