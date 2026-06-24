import { Prisma, User as PrismaUser } from '@prisma/client'
import { User } from '../../../../domain/user/enterprise/entities/user'
import { UniqueEntityId } from '../../../../core/entities/unique-entity-id'

export class PrismaUserMapper {
  static toDomain(raw: PrismaUser): User {
    return User.create({
      name: raw.name,
      email: raw.email,
      password: raw.password ?? undefined,
    },
      new UniqueEntityId(raw.id)
    )
  }

  static toPrisma(user: User): Prisma.UserUncheckedCreateInput {
    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      password: user.password || null,
    }
  }
}