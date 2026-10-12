import { UniqueEntityId } from '../../../../core/entities/unique-entity-id'
import { InMemoryCommentsRepository } from '../../../../../test/repositories/in-memory-comments-repository'
import { makeComment } from '../../../../../test/factories/make-comment'
import { DeleteCommentUseCase } from './delete-comment-use-case'
import { NotAllowedError } from './errors/not-allowed-error'
import { ResourceNotFoundError } from './errors/resource-not-found-error'

describe('Delete comment', () => {
  it('only the author can delete', async () => {
    const commentsRepository = new InMemoryCommentsRepository()
    const sut = new DeleteCommentUseCase(commentsRepository)
    const comment = makeComment({ authorId: new UniqueEntityId('author-1') })
    commentsRepository.items.push(comment)

    const byOther = await sut.execute({ authorId: 'other', commentId: comment.id.toString() })
    expect(byOther.value).toBeInstanceOf(NotAllowedError)

    const byAuthor = await sut.execute({ authorId: 'author-1', commentId: comment.id.toString() })
    expect(byAuthor.isRight()).toBe(true)
    expect(commentsRepository.items).toHaveLength(0)

    const again = await sut.execute({ authorId: 'author-1', commentId: comment.id.toString() })
    expect(again.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
