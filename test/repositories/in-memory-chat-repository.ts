import { ChatRepository } from '../../src/domain/AI/application/repositories/chat-repository'
import { Chat } from '../../src/domain/AI/enterprise/entity/chat'

export class InMemoryChatRepository implements ChatRepository {
  public items: Chat[] = []

  async create(chat: Chat) {
    this.items.push(chat)
  }

  async findById(id: string) {
    return this.items.find((item) => item.id.toString() === id) ?? null
  }

  async save(chat: Chat) {
    const index = this.items.findIndex((item) => item.id.equals(chat.id))
    this.items[index] = chat
  }
}
