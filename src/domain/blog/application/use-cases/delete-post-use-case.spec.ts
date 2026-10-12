import { UniqueEntityId } from '../../../../core/entities/unique-entity-id'
import { InMemoryPostsRepository } from '../../../../../test/repositories/in-memory-posts-repository'
import { makePost } from '../../../../../test/factories/make-post'
import { DeletePostUseCase } from './delete-post-use-case'
import { NotAllowedError } from './errors/not-allowed-error'

let postsRepository: InMemoryPostsRepository
let sut: DeletePostUseCase

describe('Delete post', () => {
  beforeEach(() => {
    postsRepository = new InMemoryPostsRepository()
    sut = new DeletePostUseCase(postsRepository)
  })

  it('lets the author delete the post', async () => {
    const post = makePost({ authorId: new UniqueEntityId('author-1') })
    postsRepository.items.push(post)

    const result = await sut.execute({ authorId: 'author-1', postId: post.id.toString() })

    expect(result.isRight()).toBe(true)
    expect(postsRepository.items).toHaveLength(0)
  })

  it('does not let anyone else delete it', async () => {
    const post = makePost({ authorId: new UniqueEntityId('author-1') })
    postsRepository.items.push(post)

    const result = await sut.execute({ authorId: 'someone-else', postId: post.id.toString() })

    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(postsRepository.items).toHaveLength(1)
  })
})
