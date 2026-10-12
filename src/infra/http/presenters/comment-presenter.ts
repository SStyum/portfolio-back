import { Comment } from "../../../domain/blog/enterprise/entities/comment";

export class CommentPresenter {
  static toHTTP(comment: Comment) {
    return {
      id: comment.id.toString(),
      postId: comment.postId.toString(),
      authorId: comment.authorId.toString(),
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    }
  }
}
