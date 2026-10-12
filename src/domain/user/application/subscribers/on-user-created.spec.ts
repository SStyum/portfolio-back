import { DomainEvents } from '../../../../core/events/domain-events'
import { InMemoryUsersRepository } from '../../../../../test/repositories/in-memory-users-repository'
import { FakeEmailVerificationToken } from '../../../../../test/fakes/fake-email-verification-token'
import { FakeUserNotifier } from '../../../../../test/fakes/fake-user-notifier'
import { waitFor } from '../../../../../test/utils/wait-for'
import { User } from '../../enterprise/entities/user'
import { SendEmailVerificationUseCase } from '../use-cases/send-email-verification-use-case'
import { OnUserCreated } from './on-user-created'

let usersRepository: InMemoryUsersRepository
let notifier: FakeUserNotifier

describe('On user created', () => {
  beforeEach(() => {
    DomainEvents.clearHandlers()
    usersRepository = new InMemoryUsersRepository()
    notifier = new FakeUserNotifier()
    new OnUserCreated(new SendEmailVerificationUseCase(usersRepository, new FakeEmailVerificationToken(), notifier))
  })

  it('sends the verification e-mail after a password sign-up', async () => {
    await usersRepository.create(User.create({ name: 'Ana', email: 'ana@example.com', password: 'x' }))

    await waitFor(() => expect(notifier.verifications).toHaveLength(1))
  })

  it('does not send it for users that are already verified (social login)', async () => {
    await usersRepository.create(User.create({ name: 'Ana', email: 'ana@example.com', emailVerifiedAt: new Date() }))

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(notifier.verifications).toHaveLength(0)
  })
})
