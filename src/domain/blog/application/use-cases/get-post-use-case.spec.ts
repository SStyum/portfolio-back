import { InMemoryPostsRepository } from '../../../../../test/repositories/in-memory-posts-repository'
import { makePost } from '../../../../../test/factories/make-post'
import { ResourceNotFoundError } from './errors/resource-not-found-error'
import { GetPostUseCase } from './get-post-use-case'

describe('Get post', () => {
  it('returns the post or ResourceNotFoundError', async () => {
    const postsRepository = new InMemoryPostsRepository()
    const post = makePost()
    postsRepository.items.push(post)
    const sut = new GetPostUseCase(postsRepository)

    const found = await sut.execute({ postId: post.id.toString() })
    const missing = await sut.execute({ postId: 'missing' })

    expect(found.isRight() && found.value.post).toBe(post)
    expect(missing.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
