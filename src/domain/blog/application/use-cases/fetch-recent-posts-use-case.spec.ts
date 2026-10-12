import { InMemoryPostsRepository } from '../../../../../test/repositories/in-memory-posts-repository'
import { makePost } from '../../../../../test/factories/make-post'
import { FetchRecentPostsUseCase } from './fetch-recent-posts-use-case'

describe('Fetch recent posts', () => {
  it('returns the newest first, 20 per page', async () => {
    const postsRepository = new InMemoryPostsRepository()
    const sut = new FetchRecentPostsUseCase(postsRepository)

    for (let day = 1; day <= 22; day++) {
      postsRepository.items.push(makePost({ title: `post ${day}`, createdAt: new Date(2026, 0, day) }))
    }

    const page1 = await sut.execute({ page: 1 })
    const page2 = await sut.execute({ page: 2 })

    expect(page1.isRight() && page1.value.posts).toHaveLength(20)
    expect(page1.isRight() && page1.value.posts[0].title).toBe('post 22')
    expect(page2.isRight() && page2.value.posts.map((p) => p.title)).toEqual(['post 2', 'post 1'])
  })
})
