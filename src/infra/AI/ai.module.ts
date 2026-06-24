import { Module } from '@nestjs/common'
import { AiService } from '../../domain/AI/application/gateway/ai.gateway';
import { GroqProvider } from './groq/ai-service';

@Module({
  providers: [
    {
      provide: AiService,
      useClass: GroqProvider,
    },
  ],
  exports: [
    AiService,
  ],
})
export class AIModule {}