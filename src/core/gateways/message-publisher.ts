// Para adicionar Kafka/RabbitMQ: inclua aqui e registre o publisher em messaging.module.ts
export const MESSAGING_PROVIDERS = ["SQS"] as const;
export type MessagingProviderName = typeof MESSAGING_PROVIDERS[number];

export interface Message<T = unknown> {
  // Nome lógico do evento, ex.: "payment.created".
  // Kafka: tópico | RabbitMQ: routing key | SQS: atributo "topic" da mensagem
  topic: string
  payload: T
  // Chave de ordenação/particionamento.
  // Kafka: message key | SQS FIFO: MessageGroupId | RabbitMQ: ignorada
  key?: string
  headers?: Record<string, string>
}

export abstract class MessagePublisher {
  abstract publish<T>(message: Message<T>): Promise<void>
}
