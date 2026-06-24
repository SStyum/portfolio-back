import { Prisma, Message as PrismaMessage } from '@prisma/client'
import { UniqueEntityId } from '../../../../core/entities/unique-entity-id'
import { Message } from '../../../../domain/AI/enterprise/entity/message'

export class PrismaMessageMapper {
  static toDomain(raw: PrismaMessage): Message {
    return Message.create({
        chatId: raw.chatId,
        content: raw.content,
        createdAt: raw.createdAt,
        role: raw.role as 'user' || 'assistant'
    },
      new UniqueEntityId(raw.id)
    )
  }

  static toPrisma(message: Message): Prisma.MessageUncheckedCreateInput {
    return {
      id: message.id.toString(),
      chatId: message.chatId,
      content: message.content,
      role: message.role
    }
  }
}