import { Prisma, Comment as PrismaComment } from '@prisma/client'
import { UniqueEntityId } from '../../../../core/entities/unique-entity-id'
import { Comment } from '../../../../domain/blog/enterprise/entities/comment'

export class PrismaCommentMapper {
  static toDomain(raw: PrismaComment): Comment {
    return Comment.create({
      authorId: new UniqueEntityId(raw.userId),
      postId: new UniqueEntityId(raw.postId),
      content: raw.content,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt ?? undefined,
    },
      new UniqueEntityId(raw.id)
    )
  }

  static toPrisma(comment: Comment): Prisma.CommentUncheckedCreateInput {
    return {
      id: comment.id.toString(),
      userId: comment.authorId.toString(),
      postId: comment.postId.toString(),
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    }
  }
}
