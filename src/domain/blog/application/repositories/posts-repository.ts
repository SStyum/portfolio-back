import { PaginationParams } from "../../../../core/repositories/pagination-params";
import { Post } from "../../enterprise/entities/post";

export abstract class PostsRepository {
  abstract create(post: Post): Promise<void>
  abstract findById(id: string): Promise<Post | null>
  abstract findManyRecent(params: PaginationParams): Promise<Post[]>
  abstract delete(post: Post): Promise<void>
}
