import { Module, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { MessagePublisher, MessagingProviderName } from '../../core/gateways/message-publisher';
import { EnvModule } from '../env/env.module';
import { EnvService } from '../env/env.service';
import { MeteredMessagePublisher } from './metered-message-publisher';
import { RabbitMqMessagePublisher } from './rabbitmq/rabbitmq-message-publisher';
import { SqsMessagePublisher } from './sqs/sqs-message-publisher';

// Uma entrada por broker. O Record força registrar todo provider declarado em MessagingProviderName.
const MESSAGE_PUBLISHERS: Record<MessagingProviderName, Type<MessagePublisher>> = {
  SQS: SqsMessagePublisher,
  RABBITMQ: RabbitMqMessagePublisher,
};

@Module({
  imports: [EnvModule],
  providers: [
    {
      provide: MessagePublisher,
      inject: [EnvService, ModuleRef],
      // Só instancia o publisher escolhido em MESSAGING_PROVIDER, já com métricas
      useFactory: async (env: EnvService, moduleRef: ModuleRef) => {
        const provider = env.get('MESSAGING_PROVIDER');
        const publisher = await moduleRef.create(MESSAGE_PUBLISHERS[provider]);

        return new MeteredMessagePublisher(publisher, provider);
      },
    },
  ],
  exports: [MessagePublisher],
})
export class MessagingModule {}
