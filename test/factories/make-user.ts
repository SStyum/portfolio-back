import { Injectable } from '@nestjs/common'
import { hash } from 'bcrypt'
import { UniqueEntityId } from '../../src/core/entities/unique-entity-id'
import { PrismaUserMapper } from '../../src/infra/database/prisma/mapper/prisma-user-mapper'
import { PrismaService } from '../../src/infra/database/prisma/prisma.service'
import { User } from '../../src/domain/user/enterprise/entities/user'

type Override = Partial<Parameters<typeof User.create>[0]>

// Com id = usuário "vindo do banco" (não dispara UserCreatedEvent)
export function makeUser(override: Override = {}, id?: UniqueEntityId) {
  return User.create({
    name: 'Ana',
    email: `ana-${Math.random().toString(36).slice(2)}@example.com`,
    password: '12345678-hashed',
    emailVerifiedAt: new Date(),
    ...override,
  }, id ?? new UniqueEntityId())
}

// E2E: grava direto no banco. `plainPassword` gera um hash bcrypt de verdade (pra testar o login)
@Injectable()
export class UserFactory {
  constructor(private prisma: PrismaService) { }

  async makePrismaUser(override: Override & { plainPassword?: string } = {}) {
    const { plainPassword, ...data } = override
    const user = makeUser({
      ...data,
      ...(plainPassword && { password: await hash(plainPassword, 4) }),
    })

    await this.prisma.user.create({ data: PrismaUserMapper.toPrisma(user) })

    return user
  }
}
