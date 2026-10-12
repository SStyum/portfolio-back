import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { connect, type ConfirmChannel, type RecoveringChannelModel } from 'amqplib';
import { randomUUID } from 'node:crypto';
import { Message, MessagePublisher } from '../../../core/gateways/message-publisher';
import { EnvService } from '../../env/env.service';

/**
 * Publica num exchange do tipo `topic`: o `topic` da mensagem vira a routing key,
 * e cada fila escolhe o que recebe pelo binding (ex.: `comment.*`).
 * A topologia (filas, bindings, DLX) fica em rabbitmq/definitions.json.
 */
@Injectable()
export class RabbitMqMessagePublisher implements MessagePublisher, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqMessagePublisher.name);
  private readonly url: string;
  private readonly exchange: string;

  // Conexão e canal são criados no primeiro publish: a API sobe mesmo com o broker fora do ar
  private connection?: Promise<RecoveringChannelModel>;
  private channel?: Promise<ConfirmChannel>;

  constructor(env: EnvService) {
    this.url = env.get('RABBITMQ_URL')!;
    this.exchange = env.get('RABBITMQ_EXCHANGE');
  }

  async publish<T>({ topic, payload, headers }: Message<T>): Promise<void> {
    const channel = await this.getChannel();

    channel.publish(this.exchange, topic, Buffer.from(JSON.stringify(payload)), {
      persistent: true, // sobrevive a restart do broker (fila durável)
      contentType: 'application/json',
      messageId: randomUUID(),
      timestamp: Date.now(),
      type: topic,
      headers,
    });

    // Confirm channel: só resolve quando o broker confirma que recebeu
    await channel.waitForConfirms();
  }

  async onModuleDestroy() {
    if (this.connection) {
      await (await this.connection).close();
    }
  }

  private getChannel(): Promise<ConfirmChannel> {
    // Reconexão automática com backoff exponencial + jitter
    this.connection ??= connect(this.url, {
      recovery: { maxDelay: 10_000, initialMaxRetries: 3 },
    }).catch((error) => {
      this.connection = undefined;
      throw error;
    });

    this.channel ??= this.connection
      .then(async (connection) => {
        await connection.waitForConnect();
        const channel = await connection.createConfirmChannel();

        // O canal morre junto com a conexão; o próximo publish cria outro
        const reset = () => { this.channel = undefined; };
        channel.on('close', reset);
        channel.on('error', (error) => {
          this.logger.warn(`RabbitMQ channel error: ${error.message}`);
          reset();
        });

        await channel.assertExchange(this.exchange, 'topic', { durable: true });

        return channel;
      })
      .catch((error) => {
        this.channel = undefined;
        throw error;
      });

    return this.channel;
  }
}
