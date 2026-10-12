import { InMemoryUsersRepository } from '../../../../../test/repositories/in-memory-users-repository'
import { FakeHasher } from '../../../../../test/fakes/fake-hasher'
import { FakeEncrypter } from '../../../../../test/fakes/fake-encrypter'
import { makeUser } from '../../../../../test/factories/make-user'
import { AuthenticateUserUseCase } from './authenticate-user-use-case'
import { EmailNotVerifiedError } from './errors/email-not-verified-error'
import { WrongCredentialsError } from './errors/wrong-credentials-error'

let usersRepository: InMemoryUsersRepository
let sut: AuthenticateUserUseCase

describe('Authenticate user', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    sut = new AuthenticateUserUseCase(usersRepository, new FakeHasher(), new FakeEncrypter())
  })

  it('returns an access token with sub and role (no plan)', async () => {
    const user = makeUser({ email: 'ana@example.com', password: '12345678-hashed' })
    usersRepository.items.push(user)

    const result = await sut.execute({ email: 'ana@example.com', password: '12345678' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(JSON.parse(result.value.accessToken)).toEqual({ sub: user.id.toString(), role: 'USER' })
    }
  })

  it('rejects a wrong password', async () => {
    usersRepository.items.push(makeUser({ email: 'ana@example.com' }))

    const result = await sut.execute({ email: 'ana@example.com', password: 'wrong' })

    expect(result.value).toBeInstanceOf(WrongCredentialsError)
  })

  it('rejects an unknown e-mail with the same error (no user enumeration)', async () => {
    const result = await sut.execute({ email: 'nobody@example.com', password: '12345678' })

    expect(result.value).toBeInstanceOf(WrongCredentialsError)
  })

  it('rejects password login for accounts created with social login', async () => {
    usersRepository.items.push(makeUser({ email: 'ana@example.com', password: undefined }))

    const result = await sut.execute({ email: 'ana@example.com', password: '' })

    expect(result.value).toBeInstanceOf(WrongCredentialsError)
  })

  it('blocks login until the e-mail is verified', async () => {
    usersRepository.items.push(makeUser({ email: 'ana@example.com', emailVerifiedAt: undefined }))

    const result = await sut.execute({ email: 'ana@example.com', password: '12345678' })

    expect(result.value).toBeInstanceOf(EmailNotVerifiedError)
  })
})
