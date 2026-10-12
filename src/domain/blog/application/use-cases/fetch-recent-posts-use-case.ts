import { Injectable } from "@nestjs/common";
import { Either, right } from "../../../../core/either";
import { Post } from "../../enterprise/entities/post";
import { PostsRepository } from "../repositories/posts-repository";

interface FetchRecentPostsUseCaseRequest {
  page: number
}

type FetchRecentPostsUseCaseResponse = Either<null, {
  posts: Post[]
}>

@Injectable()
export class FetchRecentPostsUseCase {
  constructor(
    private postsRepository: PostsRepository,
  ) { }

  async execute({ page }: FetchRecentPostsUseCaseRequest): Promise<FetchRecentPostsUseCaseResponse> {
    const posts = await this.postsRepository.findManyRecent({ page })

    return right({
      posts,
    })
  }
}
