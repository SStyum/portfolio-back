import { Message, MessagePublisher, MessagingProviderName } from '../../core/gateways/message-publisher';
import { messagesPublishedTotal } from '../metrics/metrics';

// Decorator: conta publicações (sucesso/erro) de qualquer broker sem mexer nos adapters
export class MeteredMessagePublisher implements MessagePublisher {
  constructor(
    private readonly inner: MessagePublisher,
    private readonly provider: MessagingProviderName,
  ) { }

  async publish<T>(message: Message<T>): Promise<void> {
    try {
      await this.inner.publish(message);
      messagesPublishedTotal.inc({ provider: this.provider, topic: message.topic, result: 'success' });
    } catch (error) {
      messagesPublishedTotal.inc({ provider: this.provider, topic: message.topic, result: 'error' });
      throw error;
    }
  }

  // Repassa o shutdown pro adapter (fecha a conexão do RabbitMQ)
  async onModuleDestroy() {
    await (this.inner as Partial<{ onModuleDestroy(): Promise<void> }>).onModuleDestroy?.();
  }
}
