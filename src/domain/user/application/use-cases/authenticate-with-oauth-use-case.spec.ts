import { InMemoryUsersRepository } from '../../../../../test/repositories/in-memory-users-repository'
import { InMemoryOAuthAccountsRepository } from '../../../../../test/repositories/in-memory-oauth-accounts-repository'
import { FakeEncrypter } from '../../../../../test/fakes/fake-encrypter'
import { makeUser } from '../../../../../test/factories/make-user'
import { OAuthAccount } from '../../enterprise/entities/oauth-account'
import { AuthenticateWithOAuthUseCase } from './authenticate-with-oauth-use-case'
import { OAuthEmailNotVerifiedError } from './errors/oauth-email-not-verified-error'

let usersRepository: InMemoryUsersRepository
let oauthAccountsRepository: InMemoryOAuthAccountsRepository
let sut: AuthenticateWithOAuthUseCase

const github = { provider: 'GITHUB' as const, providerAccountId: '42', name: 'Ana', email: 'ana@example.com', emailVerified: true }

describe('Authenticate with OAuth', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    oauthAccountsRepository = new InMemoryOAuthAccountsRepository()
    sut = new AuthenticateWithOAuthUseCase(usersRepository, oauthAccountsRepository, new FakeEncrypter())
  })

  it('creates a verified, passwordless user on first login', async () => {
    const result = await sut.execute(github)

    expect(result.isRight() && result.value.isNewUser).toBe(true)
    expect(usersRepository.items[0]).toMatchObject({ email: 'ana@example.com', hasPassword: false, isEmailVerified: true })
    expect(oauthAccountsRepository.items[0]).toMatchObject({ provider: 'GITHUB', providerAccountId: '42' })
  })

  it('logs in an already linked account', async () => {
    const user = makeUser()
    usersRepository.items.push(user)
    oauthAccountsRepository.items.push(OAuthAccount.create({ provider: 'GITHUB', providerAccountId: '42', userId: user.id }))

    const result = await sut.execute({ ...github, email: undefined, emailVerified: false })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(JSON.parse(result.value.accessToken).sub).toBe(user.id.toString())
      expect(result.value.isNewUser).toBe(false)
    }
  })

  it('links to an existing account with the same verified e-mail (and verifies it)', async () => {
    const user = makeUser({ email: 'ana@example.com', emailVerifiedAt: undefined })
    usersRepository.items.push(user)

    const result = await sut.execute(github)

    expect(result.isRight() && result.value.isNewUser).toBe(false)
    expect(usersRepository.items).toHaveLength(1)
    expect(usersRepository.items[0].isEmailVerified).toBe(true)
    expect(oauthAccountsRepository.items[0].userId).toEqual(user.id)
  })

  it('refuses unverified provider e-mails (prevents account takeover)', async () => {
    usersRepository.items.push(makeUser({ email: 'ana@example.com' }))

    const result = await sut.execute({ ...github, emailVerified: false })

    expect(result.value).toBeInstanceOf(OAuthEmailNotVerifiedError)
    expect(oauthAccountsRepository.items).toHaveLength(0)
  })
})
