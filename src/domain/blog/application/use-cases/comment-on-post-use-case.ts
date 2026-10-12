import { Injectable } from "@nestjs/common";
import { Either, left, right } from "../../../../core/either";
import { UniqueEntityId } from "../../../../core/entities/unique-entity-id";
import { Comment } from "../../enterprise/entities/comment";
import { CommentsRepository } from "../repositories/comments-repository";
import { PostsRepository } from "../repositories/posts-repository";
import { ResourceNotFoundError } from "./errors/resource-not-found-error";

interface CommentOnPostUseCaseRequest {
  authorId: string
  postId: string
  content: string
}

type CommentOnPostUseCaseResponse = Either<ResourceNotFoundError, {
  comment: Comment
}>

@Injectable()
export class CommentOnPostUseCase {
  constructor(
    private postsRepository: PostsRepository,
    private commentsRepository: CommentsRepository,
  ) { }

  async execute({ authorId, postId, content }: CommentOnPostUseCaseRequest): Promise<CommentOnPostUseCaseResponse> {
    const post = await this.postsRepository.findById(postId)

    if (!post) {
      return left(new ResourceNotFoundError('Post'))
    }

    const comment = Comment.create({
      authorId: new UniqueEntityId(authorId),
      postId: post.id,
      content,
    })

    await this.commentsRepository.create(comment)

    return right({
      comment,
    })
  }
}
