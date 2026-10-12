import { Injectable } from '@nestjs/common'
import { UniqueEntityId } from '../../src/core/entities/unique-entity-id'
import { PrismaPostMapper } from '../../src/infra/database/prisma/mapper/prisma-post-mapper'
import { PrismaService } from '../../src/infra/database/prisma/prisma.service'
import { Post } from '../../src/domain/blog/enterprise/entities/post'

type Override = Partial<Parameters<typeof Post.create>[0]>

export function makePost(override: Override = {}, id?: UniqueEntityId) {
  return Post.create({
    authorId: new UniqueEntityId(),
    title: 'Clean Architecture na prática',
    content: 'Conteúdo do post',
    ...override,
  }, id ?? new UniqueEntityId())
}

@Injectable()
export class PostFactory {
  constructor(private prisma: PrismaService) { }

  async makePrismaPost(override: Override = {}) {
    const post = makePost(override)

    await this.prisma.post.create({ data: PrismaPostMapper.toPrisma(post) })

    return post
  }
}
