import { Prisma, Chat as PrismaChat } from '../../../../generated/prisma/client'
import { UniqueEntityId } from '../../../../core/entities/unique-entity-id'
import { Chat } from '../../../../domain/IA/enterprise/entity/chat'

export class PrismaChatMapper {
  static toDomain(raw: PrismaChat): Chat {
    return Chat.create({
      title: raw.title,
      userId: raw.userId,
      createdAt: raw.createdAt
    },
      new UniqueEntityId(raw.id)
    )
  }

  static toPrisma(chat: Chat): Prisma.ChatUncheckedCreateInput {
    return {
      id: chat.id.toString(),
      title: chat.title,
      userId: chat.userId,
      createdAt: chat.createdAt,
    }
  }
}