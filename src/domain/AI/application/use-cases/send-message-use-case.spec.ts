import { InMemoryChatRepository } from '../../../../../test/repositories/in-memory-chat-repository'
import { InMemoryMessageRepository } from '../../../../../test/repositories/in-memory-message-repository'
import { InMemoryUsersRepository } from '../../../../../test/repositories/in-memory-users-repository'
import { FakeAiService } from '../../../../../test/fakes/fake-ai-service'
import { makeChat } from '../../../../../test/factories/make-chat'
import { makeUser } from '../../../../../test/factories/make-user'
import { Message } from '../../enterprise/entity/message'
import { NotAllowedError } from './errors/not-allowed-error'
import { QuotaExceededError } from './errors/quota-exceeded-error'
import { ResourceNotFoundError } from './errors/resource-not-found-error'
import { SendMessageUseCase } from './send-message-use-case'

let chatRepository: InMemoryChatRepository
let messageRepository: InMemoryMessageRepository
let usersRepository: InMemoryUsersRepository
let ai: FakeAiService
let sut: SendMessageUseCase

function fillMessagesToday(chatId: string, count: number) {
  for (let i = 0; i < count; i++) {
    messageRepository.items.push(Message.create({ role: 'user', content: `m${i}`, chatId, createdAt: new Date() }))
  }
}

describe('Send message to AI', () => {
  beforeEach(() => {
    chatRepository = new InMemoryChatRepository()
    messageRepository = new InMemoryMessageRepository(chatRepository)
    usersRepository = new InMemoryUsersRepository()
    ai = new FakeAiService()
    sut = new SendMessageUseCase(chatRepository, messageRepository, ai, usersRepository)
  })

  it('stores the question and the answer', async () => {
    const user = makeUser()
    const chat = makeChat({ userId: user.id.toString() })
    usersRepository.items.push(user)
    chatRepository.items.push(chat)

    const result = await sut.execute({ userId: user.id.toString(), chatId: chat.id.toString(), content: 'O que é DDD?' })

    expect(result.isRight() && result.value.answer).toBe('resposta da IA')
    expect(messageRepository.items.map((m) => m.role)).toEqual(['user', 'assistant'])
  })

  it('does not allow sending messages to someone else\'s chat', async () => {
    const chat = makeChat()
    chatRepository.items.push(chat)

    const result = await sut.execute({ userId: 'intruder', chatId: chat.id.toString(), content: 'oi' })

    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(ai.calls).toHaveLength(0)
  })

  it('returns ResourceNotFoundError for an unknown chat', async () => {
    const result = await sut.execute({ userId: 'u', chatId: 'missing', content: 'oi' })

    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('enforces the daily quota of the FREE plan (20) without calling the AI', async () => {
    const user = makeUser({ plan: 'FREE' })
    const chat = makeChat({ userId: user.id.toString() })
    usersRepository.items.push(user)
    chatRepository.items.push(chat)
    fillMessagesToday(chat.id.toString(), 20)

    const result = await sut.execute({ userId: user.id.toString(), chatId: chat.id.toString(), content: 'oi' })

    expect(result.value).toBeInstanceOf(QuotaExceededError)
    expect(ai.calls).toHaveLength(0)
  })

  it('lets PAID users go beyond the FREE quota', async () => {
    const user = makeUser({ plan: 'PAID' })
    const chat = makeChat({ userId: user.id.toString() })
    usersRepository.items.push(user)
    chatRepository.items.push(chat)
    fillMessagesToday(chat.id.toString(), 20)

    const result = await sut.execute({ userId: user.id.toString(), chatId: chat.id.toString(), content: 'oi' })

    expect(result.isRight()).toBe(true)
  })

  it('sends at most the last 20 messages as context to the AI', async () => {
    const user = makeUser({ plan: 'PAID' })
    const chat = makeChat({ userId: user.id.toString() })
    usersRepository.items.push(user)
    chatRepository.items.push(chat)
    fillMessagesToday(chat.id.toString(), 30)

    await sut.execute({ userId: user.id.toString(), chatId: chat.id.toString(), content: 'última' })

    expect(ai.calls[0]).toHaveLength(20)
    expect(ai.calls[0].at(-1)).toEqual({ role: 'user', content: 'última' })
  })
})
