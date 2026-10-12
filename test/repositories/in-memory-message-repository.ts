import { MessageRepository } from '../../src/domain/AI/application/repositories/message-repository'
import { Message } from '../../src/domain/AI/enterprise/entity/message'
import { InMemoryChatRepository } from './in-memory-chat-repository'

export class InMemoryMessageRepository implements MessageRepository {
  public items: Message[] = []

  // Precisa dos chats pra saber de quem é cada mensagem
  constructor(private chatRepository: InMemoryChatRepository) { }

  async create(message: Message) {
    this.items.push(message)
  }

  async findByChatId(chatId: string, limit?: number) {
    const messages = this.items.filter((item) => item.chatId === chatId)

    return limit ? messages.slice(-limit) : messages
  }

  async countUserMessagesSince(userId: string, since: Date) {
    const userChatIds = this.chatRepository.items
      .filter((chat) => chat.userId === userId)
      .map((chat) => chat.id.toString())

    return this.items.filter((item) =>
      item.role === 'user' && item.createdAt >= since && userChatIds.includes(item.chatId),
    ).length
  }
}
