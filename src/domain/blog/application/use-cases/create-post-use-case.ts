import { Injectable } from "@nestjs/common";
import { Either, right } from "../../../../core/either";
import { UniqueEntityId } from "../../../../core/entities/unique-entity-id";
import { Post } from "../../enterprise/entities/post";
import { PostsRepository } from "../repositories/posts-repository";

interface CreatePostUseCaseRequest {
  authorId: string
  title: string
  content: string
}

type CreatePostUseCaseResponse = Either<null, {
  post: Post
}>

@Injectable()
export class CreatePostUseCase {
  constructor(
    private postsRepository: PostsRepository,
  ) { }

  async execute({ authorId, title, content }: CreatePostUseCaseRequest): Promise<CreatePostUseCaseResponse> {
    const post = Post.create({
      authorId: new UniqueEntityId(authorId),
      title,
      content,
    })

    await this.postsRepository.create(post)

    return right({
      post,
    })
  }
}
