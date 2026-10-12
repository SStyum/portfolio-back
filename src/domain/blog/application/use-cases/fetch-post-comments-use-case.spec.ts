import { UniqueEntityId } from '../../../../core/entities/unique-entity-id'
import { InMemoryCommentsRepository } from '../../../../../test/repositories/in-memory-comments-repository'
import { makeComment } from '../../../../../test/factories/make-comment'
import { FetchPostCommentsUseCase } from './fetch-post-comments-use-case'

describe('Fetch post comments', () => {
  it('returns only the comments of that post, paginated', async () => {
    const commentsRepository = new InMemoryCommentsRepository()
    const sut = new FetchPostCommentsUseCase(commentsRepository)
    const postId = new UniqueEntityId('post-1')

    for (let i = 0; i < 22; i++) {
      commentsRepository.items.push(makeComment({ postId }))
    }
    commentsRepository.items.push(makeComment({ postId: new UniqueEntityId('other-post') }))

    const page1 = await sut.execute({ postId: 'post-1', page: 1 })
    const page2 = await sut.execute({ postId: 'post-1', page: 2 })

    expect(page1.isRight() && page1.value.comments).toHaveLength(20)
    expect(page2.isRight() && page2.value.comments).toHaveLength(2)
  })
})
