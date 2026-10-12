import { Injectable } from "@nestjs/common";
import { OAuthAccountsRepository } from "../../../../domain/user/application/repositories/oauth-accounts-repository";
import { OAuthAccount, OAuthProviderName } from "../../../../domain/user/enterprise/entities/oauth-account";
import { PrismaOAuthAccountMapper } from "../mapper/prisma-oauth-account-mapper";
import { PrismaService } from "../prisma.service";

@Injectable()
export class PrismaOAuthAccountsRepository implements OAuthAccountsRepository {

  constructor(private prisma: PrismaService) {}

  async findByProviderAccount(provider: OAuthProviderName, providerAccountId: string): Promise<OAuthAccount | null> {
    const account = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId
        }
      }
    })

    if (!account) {
      return null
    }

    return PrismaOAuthAccountMapper.toDomain(account)
  }

  async create(account: OAuthAccount): Promise<void> {
    await this.prisma.oAuthAccount.create({
      data: PrismaOAuthAccountMapper.toPrisma(account)
    })
  }
}
