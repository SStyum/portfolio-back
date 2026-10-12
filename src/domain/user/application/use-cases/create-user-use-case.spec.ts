import { InMemoryUsersRepository } from '../../../../../test/repositories/in-memory-users-repository'
import { FakeHasher } from '../../../../../test/fakes/fake-hasher'
import { makeUser } from '../../../../../test/factories/make-user'
import { CreateAccountUseCase } from './create-user-use-case'
import { UserAlreadyExistsError } from './errors/user-already-exists-error'

let usersRepository: InMemoryUsersRepository
let sut: CreateAccountUseCase

describe('Create account', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    sut = new CreateAccountUseCase(usersRepository, new FakeHasher())
  })

  it('creates an unverified FREE user with a hashed password', async () => {
    const result = await sut.execute({ name: 'Ana', email: 'ana@example.com', password: '12345678' })

    expect(result.isRight()).toBe(true)
    expect(usersRepository.items[0]).toMatchObject({
      email: 'ana@example.com',
      password: '12345678-hashed',
      plan: 'FREE',
      role: 'USER',
      isEmailVerified: false,
    })
  })

  it('does not allow two accounts with the same e-mail', async () => {
    usersRepository.items.push(makeUser({ email: 'ana@example.com' }))

    const result = await sut.execute({ name: 'Ana', email: 'ana@example.com', password: '12345678' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UserAlreadyExistsError)
  })
})
