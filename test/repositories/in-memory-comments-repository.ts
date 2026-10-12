import { DomainEvents } from '../../src/core/events/domain-events'
import { PAGE_SIZE, PaginationParams } from '../../src/core/repositories/pagination-params'
import { CommentsRepository } from '../../src/domain/blog/application/repositories/comments-repository'
import { Comment } from '../../src/domain/blog/enterprise/entities/comment'

export class InMemoryCommentsRepository implements CommentsRepository {
  public items: Comment[] = []

  async create(comment: Comment) {
    this.items.push(comment)
    DomainEvents.dispatchEventsForAggregate(comment.id)
  }

  async findById(id: string) {
    return this.items.find((item) => item.id.toString() === id) ?? null
  }

  async findManyByPostId(postId: string, { page }: PaginationParams) {
    return this.items
      .filter((item) => item.postId.toString() === postId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  }

  async delete(comment: Comment) {
    this.items = this.items.filter((item) => !item.id.equals(comment.id))
  }
}
