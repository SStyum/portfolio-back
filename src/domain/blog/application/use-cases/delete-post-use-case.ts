import { Injectable } from "@nestjs/common";
import { Either, left, right } from "../../../../core/either";
import { PostsRepository } from "../repositories/posts-repository";
import { NotAllowedError } from "./errors/not-allowed-error";
import { ResourceNotFoundError } from "./errors/resource-not-found-error";

interface DeletePostUseCaseRequest {
  authorId: string
  postId: string
}

type DeletePostUseCaseResponse = Either<ResourceNotFoundError | NotAllowedError, null>

@Injectable()
export class DeletePostUseCase {
  constructor(
    private postsRepository: PostsRepository,
  ) { }

  async execute({ authorId, postId }: DeletePostUseCaseRequest): Promise<DeletePostUseCaseResponse> {
    const post = await this.postsRepository.findById(postId)

    if (!post) {
      return left(new ResourceNotFoundError('Post'))
    }

    if (!post.isAuthor(authorId)) {
      return left(new NotAllowedError())
    }

    // Os comentários caem junto (onDelete: Cascade no banco)
    await this.postsRepository.delete(post)

    return right(null)
  }
}
