import { Post } from "../../../domain/blog/enterprise/entities/post";

export class PostPresenter {
  static toHTTP(post: Post) {
    return {
      id: post.id.toString(),
      authorId: post.authorId.toString(),
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }
  }

  // Versão resumida pra listagem
  static toHTTPSummary(post: Post) {
    return {
      id: post.id.toString(),
      authorId: post.authorId.toString(),
      title: post.title,
      excerpt: post.excerpt,
      createdAt: post.createdAt,
    }
  }
}
