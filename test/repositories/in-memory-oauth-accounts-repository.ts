import { OAuthAccountsRepository } from '../../src/domain/user/application/repositories/oauth-accounts-repository'
import { OAuthAccount, OAuthProviderName } from '../../src/domain/user/enterprise/entities/oauth-account'

export class InMemoryOAuthAccountsRepository implements OAuthAccountsRepository {
  public items: OAuthAccount[] = []

  async findByProviderAccount(provider: OAuthProviderName, providerAccountId: string) {
    return this.items.find((item) => item.provider === provider && item.providerAccountId === providerAccountId) ?? null
  }

  async create(account: OAuthAccount) {
    this.items.push(account)
  }
}
