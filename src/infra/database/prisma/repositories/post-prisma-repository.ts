import { Injectable } from "@nestjs/common";
import { PAGE_SIZE, PaginationParams } from "../../../../core/repositories/pagination-params";
import { PostsRepository } from "../../../../domain/blog/application/repositories/posts-repository";
import { Post } from "../../../../domain/blog/enterprise/entities/post";
import { PrismaPostMapper } from "../mapper/prisma-post-mapper";
import { PrismaService } from "../prisma.service";

@Injectable()
export class PrismaPostsRepository implements PostsRepository {

  constructor(private prisma: PrismaService) {}

  async create(post: Post): Promise<void> {
    const data = PrismaPostMapper.toPrisma(post)

    await this.prisma.post.create({
      data
    })
  }

  async findById(id: string): Promise<Post | null> {
    const post = await this.prisma.post.findUnique({
      where: {
        id
      }
    })

    if (!post) {
      return null
    }

    return PrismaPostMapper.toDomain(post)
  }

  async findManyRecent({ page }: PaginationParams): Promise<Post[]> {
    const posts = await this.prisma.post.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    })

    return posts.map(PrismaPostMapper.toDomain)
  }

  async delete(post: Post): Promise<void> {
    await this.prisma.post.delete({
      where: {
        id: post.id.toString()
      }
    })
  }
}
