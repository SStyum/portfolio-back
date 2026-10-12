import { Prisma, Post as PrismaPost } from '@prisma/client'
import { UniqueEntityId } from '../../../../core/entities/unique-entity-id'
import { Post } from '../../../../domain/blog/enterprise/entities/post'

export class PrismaPostMapper {
  static toDomain(raw: PrismaPost): Post {
    return Post.create({
      authorId: new UniqueEntityId(raw.userId),
      title: raw.title,
      content: raw.content,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt ?? undefined,
    },
      new UniqueEntityId(raw.id)
    )
  }

  static toPrisma(post: Post): Prisma.PostUncheckedCreateInput {
    return {
      id: post.id.toString(),
      userId: post.authorId.toString(),
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }
  }
}
