import { PaginationParams } from "../../../../core/repositories/pagination-params";
import { Comment } from "../../enterprise/entities/comment";

export abstract class CommentsRepository {
  abstract create(comment: Comment): Promise<void>
  abstract findById(id: string): Promise<Comment | null>
  abstract findManyByPostId(postId: string, params: PaginationParams): Promise<Comment[]>
  abstract delete(comment: Comment): Promise<void>
}
