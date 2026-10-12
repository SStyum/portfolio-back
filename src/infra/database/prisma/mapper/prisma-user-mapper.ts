import { Prisma, User as PrismaUser } from '@prisma/client'
import { User } from '../../../../domain/user/enterprise/entities/user'
import { UniqueEntityId } from '../../../../core/entities/unique-entity-id'

export class PrismaUserMapper {
  static toDomain(raw: PrismaUser): User {
    return User.create({
      name: raw.name,
      email: raw.email,
      password: raw.password ?? undefined,
      plan: raw.plan,
      role: raw.role,
      billingCustomerId: raw.billingCustomerId ?? undefined,
      emailVerifiedAt: raw.emailVerifiedAt ?? undefined,
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
      plan: user.plan,
      role: user.role,
      billingCustomerId: user.billingCustomerId ?? null,
      emailVerifiedAt: user.emailVerifiedAt ?? null,
    }
  }
}
