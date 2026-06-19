import { Prisma, Chat as PrismaChat } from '../../../../generated/prisma/client'
import { UniqueEntityId } from '../../../../core/entities/unique-entity-id'
import { Chat } from '../../../../domain/IA/enterprise/entity/chat'
import { PrismaChatWithMessages } from '../../../../core/types/prismaChatWithMessages'
import { PrismaMessageMapper } from './prisma-message-mapper'

export class PrismaChatMapper {
  static toDomain(raw: PrismaChatWithMessages): Chat {
    return Chat.create({
      title: raw.title,
      userId: raw.userId,
      createdAt: raw.createdAt,
      messages: raw.messages.map(PrismaMessageMapper.toDomain)
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