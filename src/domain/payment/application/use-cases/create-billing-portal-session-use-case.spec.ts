import { InMemoryUsersRepository } from '../../../../../test/repositories/in-memory-users-repository'
import { FakePaymentGateway } from '../../../../../test/fakes/fake-payment-gateway'
import { makeUser } from '../../../../../test/factories/make-user'
import { CreateBillingPortalSessionUseCase } from './create-billing-portal-session-use-case'
import { NoBillingAccountError } from './errors/no-billing-account-error'

describe('Create billing portal session', () => {
  it('needs a billing customer', async () => {
    const usersRepository = new InMemoryUsersRepository()
    const sut = new CreateBillingPortalSessionUseCase(usersRepository, new FakePaymentGateway())
    const withoutCustomer = makeUser()
    const withCustomer = makeUser({ billingCustomerId: 'cus_1' })
    usersRepository.items.push(withoutCustomer, withCustomer)

    const fail = await sut.execute({ userId: withoutCustomer.id.toString(), returnUrl: 'https://app' })
    const ok = await sut.execute({ userId: withCustomer.id.toString(), returnUrl: 'https://app' })

    expect(fail.value).toBeInstanceOf(NoBillingAccountError)
    expect(ok.isRight() && ok.value.url).toBe('https://portal.fake/cus_1')
  })
})
