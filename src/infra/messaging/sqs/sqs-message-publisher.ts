import { Injectable } from '@nestjs/common';
import { MessageAttributeValue, SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { randomUUID } from 'node:crypto';
import { Message, MessagePublisher } from '../../../core/gateways/message-publisher';
import { EnvService } from '../../env/env.service';
import { awsClientConfig } from '../../aws/aws-client-config';

@Injectable()
export class SqsMessagePublisher implements MessagePublisher {
  private readonly sqs: SQSClient;
  private readonly queueUrl: string;
  private readonly isFifo: boolean;

  constructor(env: EnvService) {
    this.sqs = new SQSClient(awsClientConfig(env));
    this.queueUrl = env.get('SQS_QUEUE_URL')!;
    this.isFifo = this.queueUrl.endsWith('.fifo');
  }

  async publish<T>({ topic, payload, key, headers }: Message<T>): Promise<void> {
    const attributes: Record<string, MessageAttributeValue> = {
      topic: { DataType: 'String', StringValue: topic },
    };

    for (const [name, value] of Object.entries(headers ?? {})) {
      attributes[name] = { DataType: 'String', StringValue: value };
    }

    await this.sqs.send(new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(payload),
      MessageAttributes: attributes,
      // Fila FIFO exige grupo (ordenação) e id de deduplicação
      ...(this.isFifo && {
        MessageGroupId: key ?? topic,
        MessageDeduplicationId: randomUUID(),
      }),
    }));
  }
}
