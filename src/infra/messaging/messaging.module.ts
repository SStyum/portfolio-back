import { Module, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { MessagePublisher, MessagingProviderName } from '../../core/gateways/message-publisher';
import { EnvModule } from '../env/env.module';
import { EnvService } from '../env/env.service';
import { SqsMessagePublisher } from './sqs/sqs-message-publisher';

// Uma entrada por broker. O Record força registrar todo provider declarado em MessagingProviderName.
const MESSAGE_PUBLISHERS: Record<MessagingProviderName, Type<MessagePublisher>> = {
  SQS: SqsMessagePublisher,
};

@Module({
  imports: [EnvModule],
  providers: [
    {
      provide: MessagePublisher,
      inject: [EnvService, ModuleRef],
      // Só instancia o publisher escolhido em MESSAGING_PROVIDER
      useFactory: (env: EnvService, moduleRef: ModuleRef) =>
        moduleRef.create(MESSAGE_PUBLISHERS[env.get('MESSAGING_PROVIDER')]),
    },
  ],
  exports: [MessagePublisher],
})
export class MessagingModule {}
