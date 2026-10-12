import { DomainEvents } from '../../../../core/events/domain-events'
import { InMemoryCommentsRepository } from '../../../../../test/repositories/in-memory-comments-repository'
import { InMemoryPostsRepository } from '../../../../../test/repositories/in-memory-posts-repository'
import { makePost } from '../../../../../test/factories/make-post'
import { CommentOnPostUseCase } from './comment-on-post-use-case'
import { ResourceNotFoundError } from './errors/resource-not-found-error'

let postsRepository: InMemoryPostsRepository
let commentsRepository: InMemoryCommentsRepository
let sut: CommentOnPostUseCase

describe('Comment on post', () => {
  beforeEach(() => {
    DomainEvents.clearHandlers()
    postsRepository = new InMemoryPostsRepository()
    commentsRepository = new InMemoryCommentsRepository()
    sut = new CommentOnPostUseCase(postsRepository, commentsRepository)
  })

  it('creates the comment', async () => {
    const post = makePost()
    postsRepository.items.push(post)

    const result = await sut.execute({ authorId: 'reader-1', postId: post.id.toString(), content: 'Ótimo!' })

    expect(result.isRight()).toBe(true)
    expect(commentsRepository.items[0]).toMatchObject({ content: 'Ótimo!' })
    expect(commentsRepository.items[0].postId).toEqual(post.id)
  })

  it('cannot comment on a post that does not exist', async () => {
    const result = await sut.execute({ authorId: 'reader-1', postId: 'missing', content: 'Ótimo!' })

    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
    expect(commentsRepository.items).toHaveLength(0)
  })
})
