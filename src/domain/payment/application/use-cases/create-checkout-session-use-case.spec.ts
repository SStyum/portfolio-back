import { InMemoryUsersRepository } from '../../../../../test/repositories/in-memory-users-repository'
import { FakePaymentGateway } from '../../../../../test/fakes/fake-payment-gateway'
import { makeUser } from '../../../../../test/factories/make-user'
import { CreateCheckoutSessionUseCase } from './create-checkout-session-use-case'
import { AlreadySubscribedError } from './errors/already-subscribed-error'

let usersRepository: InMemoryUsersRepository
let gateway: FakePaymentGateway
let sut: CreateCheckoutSessionUseCase

const urls = { successUrl: 'https://app/ok', cancelUrl: 'https://app/cancel' }

describe('Create checkout session', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    gateway = new FakePaymentGateway()
    sut = new CreateCheckoutSessionUseCase(usersRepository, gateway)
  })

  it('creates the billing customer BEFORE the checkout and saves it on the user', async () => {
    const user = makeUser()
    usersRepository.items.push(user)

    const result = await sut.execute({ userId: user.id.toString(), ...urls })

    expect(result.isRight() && result.value.url).toBe('https://checkout.fake/session')
    expect(usersRepository.items[0].billingCustomerId).toBe(`cus_${user.id.toString()}`)
    expect(gateway.checkouts[0].customerId).toBe(`cus_${user.id.toString()}`)
  })

  it('reuses an existing billing customer', async () => {
    const user = makeUser({ billingCustomerId: 'cus_existing' })
    usersRepository.items.push(user)

    await sut.execute({ userId: user.id.toString(), ...urls })

    expect(gateway.customers).toHaveLength(0)
    expect(gateway.checkouts[0].customerId).toBe('cus_existing')
  })

  it('does not start a second subscription', async () => {
    const user = makeUser({ plan: 'PAID' })
    usersRepository.items.push(user)

    const result = await sut.execute({ userId: user.id.toString(), ...urls })

    expect(result.value).toBeInstanceOf(AlreadySubscribedError)
  })
})
