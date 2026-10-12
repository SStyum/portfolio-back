import { Injectable } from "@nestjs/common"
import { Either, left, right } from "../../../../core/either"
import { OAuthAccount, OAuthProviderName } from "../../enterprise/entities/oauth-account"
import { User } from "../../enterprise/entities/user"
import { Encrypter } from "../cryptography/encrypter"
import { OAuthAccountsRepository } from "../repositories/oauth-accounts-repository"
import { UsersRepository } from "../repositories/users-respository"
import { OAuthEmailNotVerifiedError } from "./errors/oauth-email-not-verified-error"

interface AuthenticateWithOAuthUseCaseRequest {
  provider: OAuthProviderName
  providerAccountId: string
  name: string
  // E-mail principal no provedor; só é usado se o provedor garantir que é verificado
  email?: string
  emailVerified: boolean
}

type AuthenticateWithOAuthUseCaseResponse = Either<OAuthEmailNotVerifiedError, {
  accessToken: string
  isNewUser: boolean
}>

@Injectable()
export class AuthenticateWithOAuthUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private oauthAccountsRepository: OAuthAccountsRepository,
    private encrypter: Encrypter,
  ) { }

  async execute({
    provider,
    providerAccountId,
    name,
    email,
    emailVerified,
  }: AuthenticateWithOAuthUseCaseRequest): Promise<AuthenticateWithOAuthUseCaseResponse> {
    // 1. Conta do provedor já vinculada: só entra
    const account = await this.oauthAccountsRepository.findByProviderAccount(provider, providerAccountId)

    if (account) {
      const user = await this.usersRepository.findById(account.userId.toString())

      if (user) {
        return right({ accessToken: await this.signIn(user), isNewUser: false })
      }
    }

    // Sem e-mail verificado no provedor não dá pra vincular nem criar conta com segurança
    if (!email || !emailVerified) {
      return left(new OAuthEmailNotVerifiedError())
    }

    let user = await this.usersRepository.findByEmail(email)
    const isNewUser = !user

    if (user) {
      // 2. Já tem conta com esse e-mail: vincula. O provedor provou que a pessoa controla o e-mail
      user.verifyEmail()
      await this.usersRepository.save(user)
    } else {
      // 3. Primeira vez: cria a conta já verificada e sem senha
      user = User.create({
        name,
        email,
        emailVerifiedAt: new Date(),
      })
      await this.usersRepository.create(user)
    }

    await this.oauthAccountsRepository.create(OAuthAccount.create({
      provider,
      providerAccountId,
      userId: user.id,
    }))

    return right({ accessToken: await this.signIn(user), isNewUser })
  }

  private signIn(user: User) {
    return this.encrypter.encrypt({
      sub: user.id.toString(),
      role: user.role,
    })
  }
}
