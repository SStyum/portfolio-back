import { Injectable } from "@nestjs/common";
import { Either, left, right } from "../../../../core/either";
import { Post } from "../../enterprise/entities/post";
import { PostsRepository } from "../repositories/posts-repository";
import { ResourceNotFoundError } from "./errors/resource-not-found-error";

interface GetPostUseCaseRequest {
  postId: string
}

type GetPostUseCaseResponse = Either<ResourceNotFoundError, {
  post: Post
}>

@Injectable()
export class GetPostUseCase {
  constructor(
    private postsRepository: PostsRepository,
  ) { }

  async execute({ postId }: GetPostUseCaseRequest): Promise<GetPostUseCaseResponse> {
    const post = await this.postsRepository.findById(postId)

    if (!post) {
      return left(new ResourceNotFoundError('Post'))
    }

    return right({
      post,
    })
  }
}
