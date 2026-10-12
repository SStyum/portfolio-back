import { Injectable } from "@nestjs/common";
import { Either, right } from "../../../../core/either";
import { Comment } from "../../enterprise/entities/comment";
import { CommentsRepository } from "../repositories/comments-repository";

interface FetchPostCommentsUseCaseRequest {
  postId: string
  page: number
}

type FetchPostCommentsUseCaseResponse = Either<null, {
  comments: Comment[]
}>

@Injectable()
export class FetchPostCommentsUseCase {
  constructor(
    private commentsRepository: CommentsRepository,
  ) { }

  async execute({ postId, page }: FetchPostCommentsUseCaseRequest): Promise<FetchPostCommentsUseCaseResponse> {
    const comments = await this.commentsRepository.findManyByPostId(postId, { page })

    return right({
      comments,
    })
  }
}
