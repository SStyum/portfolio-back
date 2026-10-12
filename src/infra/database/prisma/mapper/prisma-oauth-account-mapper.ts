import { Prisma, OAuthAccount as PrismaOAuthAccount } from '@prisma/client'
import { UniqueEntityId } from '../../../../core/entities/unique-entity-id'
import { OAuthAccount } from '../../../../domain/user/enterprise/entities/oauth-account'

export class PrismaOAuthAccountMapper {
  static toDomain(raw: PrismaOAuthAccount): OAuthAccount {
    return OAuthAccount.create({
      provider: raw.provider,
      providerAccountId: raw.providerAccountId,
      userId: new UniqueEntityId(raw.userId),
      createdAt: raw.createdAt,
    },
      new UniqueEntityId(raw.id)
    )
  }

  static toPrisma(account: OAuthAccount): Prisma.OAuthAccountUncheckedCreateInput {
    return {
      id: account.id.toString(),
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      userId: account.userId.toString(),
      createdAt: account.createdAt,
    }
  }
}
