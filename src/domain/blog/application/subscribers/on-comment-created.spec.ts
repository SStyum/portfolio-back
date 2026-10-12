import { Logger } from '@nestjs/common'
import { DomainEvents } from '../../../../core/events/domain-events'
import { UniqueEntityId } from '../../../../core/entities/unique-entity-id'
import { InMemoryCommentsRepository } from '../../../../../test/repositories/in-memory-comments-repository'
import { InMemoryPostsRepository } from '../../../../../test/repositories/in-memory-posts-repository'
import { FakeMessagePublisher } from '../../../../../test/fakes/fake-message-publisher'
import { makePost } from '../../../../../test/factories/make-post'
import { waitFor } from '../../../../../test/utils/wait-for'
import { Comment } from '../../enterprise/entities/comment'
import { OnCommentCreated } from './on-comment-created'

let postsRepository: InMemoryPostsRepository
let commentsRepository: InMemoryCommentsRepository
let publisher: FakeMessagePublisher

describe('On comment created', () => {
  beforeEach(() => {
    DomainEvents.clearHandlers()
    postsRepository = new InMemoryPostsRepository()
    commentsRepository = new InMemoryCommentsRepository()
    publisher = new FakeMessagePublisher()
    new OnCommentCreated(postsRepository, publisher)
  })

  it('publishes comment.created with who must be notified', async () => {
    const post = makePost({ authorId: new UniqueEntityId('post-author') })
    postsRepository.items.push(post)

    const comment = Comment.create({ authorId: new UniqueEntityId('reader'), postId: post.id, content: 'Top' })
    await commentsRepository.create(comment)

    await waitFor(() => expect(publisher.published).toHaveLength(1))
    expect(publisher.published[0]).toMatchObject({
      topic: 'comment.created',
      key: post.id.toString(),
      payload: { commentId: comment.id.toString(), commentAuthorId: 'reader', postAuthorId: 'post-author' },
    })
  })

  it('does not throw when the broker is down (the comment is already saved)', async () => {
    publisher.shouldFail = true
    const post = makePost()
    postsRepository.items.push(post)
    Logger.overrideLogger(false) // o erro logado aqui é esperado

    await commentsRepository.create(Comment.create({ authorId: new UniqueEntityId(), postId: post.id, content: 'Top' }))
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(commentsRepository.items).toHaveLength(1)
    Logger.overrideLogger(['log', 'error', 'warn', 'debug', 'verbose'])
  })
})
