import { Injectable } from '@nestjs/common'
import { UniqueEntityId } from '../../src/core/entities/unique-entity-id'
import { PrismaCommentMapper } from '../../src/infra/database/prisma/mapper/prisma-comment-mapper'
import { PrismaService } from '../../src/infra/database/prisma/prisma.service'
import { Comment } from '../../src/domain/blog/enterprise/entities/comment'

type Override = Partial<Parameters<typeof Comment.create>[0]>

// Com id = comentário "vindo do banco" (não dispara CommentCreatedEvent)
export function makeComment(override: Override = {}, id?: UniqueEntityId) {
  return Comment.create({
    authorId: new UniqueEntityId(),
    postId: new UniqueEntityId(),
    content: 'Ótimo post!',
    ...override,
  }, id ?? new UniqueEntityId())
}

@Injectable()
export class CommentFactory {
  constructor(private prisma: PrismaService) { }

  async makePrismaComment(override: Override = {}) {
    const comment = makeComment(override)

    await this.prisma.comment.create({ data: PrismaCommentMapper.toPrisma(comment) })

    return comment
  }
}
