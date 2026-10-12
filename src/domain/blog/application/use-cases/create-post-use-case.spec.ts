import { InMemoryPostsRepository } from '../../../../../test/repositories/in-memory-posts-repository'
import { CreatePostUseCase } from './create-post-use-case'

describe('Create post', () => {
  it('creates a post for the author', async () => {
    const postsRepository = new InMemoryPostsRepository()
    const sut = new CreatePostUseCase(postsRepository)

    const result = await sut.execute({ authorId: 'author-1', title: 'DDD', content: 'Conteúdo' })

    expect(result.isRight()).toBe(true)
    expect(postsRepository.items[0].authorId.toString()).toBe('author-1')
  })
})
