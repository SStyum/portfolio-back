import { Injectable } from '@nestjs/common'
import { UniqueEntityId } from '../../src/core/entities/unique-entity-id'
import { Chat } from '../../src/domain/AI/enterprise/entity/chat'
import { PrismaChatMapper } from '../../src/infra/database/prisma/mapper/prisma-chat-mapper'
import { PrismaService } from '../../src/infra/database/prisma/prisma.service'

export function makeChat(override: Partial<Parameters<typeof Chat.create>[0]> = {}, id?: UniqueEntityId) {
  return Chat.create({
    title: 'Novo Chat',
    userId: new UniqueEntityId().toString(),
    messages: [],
    ...override,
  }, id)
}

@Injectable()
export class ChatFactory {
  constructor(private prisma: PrismaService) { }

  async makePrismaChat(override: Partial<Parameters<typeof Chat.create>[0]> = {}) {
    const chat = makeChat(override)

    await this.prisma.chat.create({ data: PrismaChatMapper.toPrisma(chat) })

    return chat
  }

  // Simula mensagens já enviadas hoje (pra testar a cota do plano)
  async makePrismaUserMessages(chatId: string, count: number) {
    await this.prisma.message.createMany({
      data: Array.from({ length: count }, (_, i) => ({ chatId, role: 'user', content: `mensagem ${i}` })),
    })
  }
}
