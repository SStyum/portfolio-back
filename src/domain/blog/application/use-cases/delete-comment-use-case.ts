import { Injectable } from "@nestjs/common";
import { Either, left, right } from "../../../../core/either";
import { CommentsRepository } from "../repositories/comments-repository";
import { NotAllowedError } from "./errors/not-allowed-error";
import { ResourceNotFoundError } from "./errors/resource-not-found-error";

interface DeleteCommentUseCaseRequest {
  authorId: string
  commentId: string
}

type DeleteCommentUseCaseResponse = Either<ResourceNotFoundError | NotAllowedError, null>

@Injectable()
export class DeleteCommentUseCase {
  constructor(
    private commentsRepository: CommentsRepository,
  ) { }

  async execute({ authorId, commentId }: DeleteCommentUseCaseRequest): Promise<DeleteCommentUseCaseResponse> {
    const comment = await this.commentsRepository.findById(commentId)

    if (!comment) {
      return left(new ResourceNotFoundError('Comment'))
    }

    if (!comment.isAuthor(authorId)) {
      return left(new NotAllowedError())
    }

    await this.commentsRepository.delete(comment)

    return right(null)
  }
}
