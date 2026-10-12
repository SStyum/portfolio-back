import { Injectable } from "@nestjs/common";
import { DomainEvents } from "../../../../core/events/domain-events";
import { PAGE_SIZE, PaginationParams } from "../../../../core/repositories/pagination-params";
import { CommentsRepository } from "../../../../domain/blog/application/repositories/comments-repository";
import { Comment } from "../../../../domain/blog/enterprise/entities/comment";
import { PrismaCommentMapper } from "../mapper/prisma-comment-mapper";
import { PrismaService } from "../prisma.service";

@Injectable()
export class PrismaCommentsRepository implements CommentsRepository {

  constructor(private prisma: PrismaService) {}

  async create(comment: Comment): Promise<void> {
    const data = PrismaCommentMapper.toPrisma(comment)

    await this.prisma.comment.create({
      data
    })

    // Só dispara os eventos depois que o comentário está salvo
    DomainEvents.dispatchEventsForAggregate(comment.id)
  }

  async findById(id: string): Promise<Comment | null> {
    const comment = await this.prisma.comment.findUnique({
      where: {
        id
      }
    })

    if (!comment) {
      return null
    }

    return PrismaCommentMapper.toDomain(comment)
  }

  async findManyByPostId(postId: string, { page }: PaginationParams): Promise<Comment[]> {
    const comments = await this.prisma.comment.findMany({
      where: {
        postId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    })

    return comments.map(PrismaCommentMapper.toDomain)
  }

  async delete(comment: Comment): Promise<void> {
    await this.prisma.comment.delete({
      where: {
        id: comment.id.toString()
      }
    })
  }
}
