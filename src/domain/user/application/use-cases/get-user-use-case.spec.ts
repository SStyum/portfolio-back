import { InMemoryUsersRepository } from '../../../../../test/repositories/in-memory-users-repository'
import { makeUser } from '../../../../../test/factories/make-user'
import { ResourceNotFoundError } from './errors/resource-not-found-error'
import { GetUserUseCase } from './get-user-use-case'

describe('Get user', () => {
  it('returns the user or ResourceNotFoundError', async () => {
    const usersRepository = new InMemoryUsersRepository()
    const user = makeUser()
    usersRepository.items.push(user)
    const sut = new GetUserUseCase(usersRepository)

    const found = await sut.execute({ id: user.id.toString() })
    const missing = await sut.execute({ id: 'nope' })

    expect(found.isRight() && found.value.user).toBe(user)
    expect(missing.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
