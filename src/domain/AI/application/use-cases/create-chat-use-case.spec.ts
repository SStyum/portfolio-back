import { InMemoryChatRepository } from '../../../../../test/repositories/in-memory-chat-repository'
import { CreateChatUseCase } from './create-chat-use-case'

describe('Create chat', () => {
  it('creates an empty chat for the user', async () => {
    const chatRepository = new InMemoryChatRepository()
    const sut = new CreateChatUseCase(chatRepository)

    const result = await sut.execute({ userId: 'user-1' })

    expect(result.isRight()).toBe(true)
    expect(chatRepository.items[0]).toMatchObject({ userId: 'user-1', messages: [] })
  })
})
