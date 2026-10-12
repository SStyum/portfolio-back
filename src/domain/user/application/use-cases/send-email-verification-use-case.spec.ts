import { InMemoryUsersRepository } from '../../../../../test/repositories/in-memory-users-repository'
import { FakeEmailVerificationToken } from '../../../../../test/fakes/fake-email-verification-token'
import { FakeUserNotifier } from '../../../../../test/fakes/fake-user-notifier'
import { makeUser } from '../../../../../test/factories/make-user'
import { SendEmailVerificationUseCase } from './send-email-verification-use-case'

let usersRepository: InMemoryUsersRepository
let notifier: FakeUserNotifier
let sut: SendEmailVerificationUseCase

describe('Send e-mail verification', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    notifier = new FakeUserNotifier()
    sut = new SendEmailVerificationUseCase(usersRepository, new FakeEmailVerificationToken(), notifier)
  })

  it('sends a verification token to unverified users', async () => {
    const user = makeUser({ email: 'ana@example.com', emailVerifiedAt: undefined })
    usersRepository.items.push(user)

    await sut.execute({ email: 'ana@example.com' })

    expect(notifier.verifications).toEqual([
      { name: user.name, email: 'ana@example.com', token: `verify:${user.id.toString()}` },
    ])
  })

  it('silently does nothing for unknown or already verified e-mails', async () => {
    usersRepository.items.push(makeUser({ email: 'verified@example.com' }))

    const unknown = await sut.execute({ email: 'nobody@example.com' })
    const verified = await sut.execute({ email: 'verified@example.com' })

    expect(unknown.isRight() && verified.isRight()).toBe(true)
    expect(notifier.verifications).toHaveLength(0)
  })
})
