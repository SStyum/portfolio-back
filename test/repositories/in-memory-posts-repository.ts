import { PAGE_SIZE, PaginationParams } from '../../src/core/repositories/pagination-params'
import { PostsRepository } from '../../src/domain/blog/application/repositories/posts-repository'
import { Post } from '../../src/domain/blog/enterprise/entities/post'

export class InMemoryPostsRepository implements PostsRepository {
  public items: Post[] = []

  async create(post: Post) {
    this.items.push(post)
  }

  async findById(id: string) {
    return this.items.find((item) => item.id.toString() === id) ?? null
  }

  async findManyRecent({ page }: PaginationParams) {
    return [...this.items]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  }

  async delete(post: Post) {
    this.items = this.items.filter((item) => !item.id.equals(post.id))
  }
}
