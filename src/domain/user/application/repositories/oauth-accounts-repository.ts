import { OAuthAccount, OAuthProviderName } from "../../enterprise/entities/oauth-account";

export abstract class OAuthAccountsRepository {
  abstract findByProviderAccount(provider: OAuthProviderName, providerAccountId: string): Promise<OAuthAccount | null>
  abstract create(account: OAuthAccount): Promise<void>
}
