import { InMemoryUsersRepository } from '../../../../../test/repositories/in-memory-users-repository'
import { FakeEmailVerificationToken } from '../../../../../test/fakes/fake-email-verification-token'
import { makeUser } from '../../../../../test/factories/make-user'
import { InvalidTokenError } from './errors/invalid-token-error'
import { VerifyEmailUseCase } from './verify-email-use-case'

let usersRepository: InMemoryUsersRepository
let sut: VerifyEmailUseCase

describe('Verify e-mail', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    sut = new VerifyEmailUseCase(usersRepository, new FakeEmailVerificationToken())
  })

  it('marks the e-mail as verified', async () => {
    const user = makeUser({ emailVerifiedAt: undefined })
    usersRepository.items.push(user)

    const result = await sut.execute({ token: `verify:${user.id.toString()}` })

    expect(result.isRight()).toBe(true)
    expect(usersRepository.items[0].isEmailVerified).toBe(true)
  })

  it('rejects an invalid token', async () => {
    const result = await sut.execute({ token: 'garbage' })

    expect(result.value).toBeInstanceOf(InvalidTokenError)
  })

  it('rejects a token for a user that no longer exists', async () => {
    const result = await sut.execute({ token: 'verify:deleted-user' })

    expect(result.value).toBeInstanceOf(InvalidTokenError)
  })
})
