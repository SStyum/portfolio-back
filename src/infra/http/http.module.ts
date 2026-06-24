import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module';
import { AIModule } from '../AI/ai.module';
import { SendMessageController } from './controllers/send-message.controller';
import { SendMessageUseCase } from '../../domain/AI/application/use-cases/send-message-use-case';

@Module({
  imports: [
    DatabaseModule,
    AIModule
  ],
  controllers: [
    SendMessageController
  ],
  providers: [
    SendMessageUseCase
  ],
})

export class HttpModule {}