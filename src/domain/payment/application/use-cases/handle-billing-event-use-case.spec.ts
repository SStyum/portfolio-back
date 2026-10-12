import { InMemoryPaymentsRepository } from '../../../../../test/repositories/in-memory-payments-repository'
import { InMemorySubscriptionsRepository } from '../../../../../test/repositories/in-memory-subscriptions-repository'
import { InMemoryUsersRepository } from '../../../../../test/repositories/in-memory-users-repository'
import { FakePaymentGateway } from '../../../../../test/fakes/fake-payment-gateway'
import { makeUser } from '../../../../../test/factories/make-user'
import { BillingEvent } from '../gateway/payment.gateway'
import { ResourceNotFoundError } from './errors/resource-not-found-error'
import { HandleBillingEventUseCase } from './handle-billing-event-use-case'

let usersRepository: InMemoryUsersRepository
let subscriptionsRepository: InMemorySubscriptionsRepository
let paymentsRepository: InMemoryPaymentsRepository
let sut: HandleBillingEventUseCase

const at = (minute: number) => new Date(2026, 9, 12, 12, minute)

function subscriptionEvent(status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED', occurredAt: Date, externalSubscriptionId = 'sub_1'): BillingEvent {
  return {
    type: 'subscription.updated',
    eventId: `evt_${Math.random()}`,
    occurredAt,
    externalCustomerId: 'cus_1',
    externalSubscriptionId,
    status,
    cancelAtPeriodEnd: false,
  }
}

describe('Handle billing event', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    subscriptionsRepository = new InMemorySubscriptionsRepository()
    paymentsRepository = new InMemoryPaymentsRepository()
    sut = new HandleBillingEventUseCase(usersRepository, subscriptionsRepository, paymentsRepository, new FakePaymentGateway())
    usersRepository.items.push(makeUser({ billingCustomerId: 'cus_1' }))
  })

  const plan = () => usersRepository.items[0].plan

  it('active subscription → PAID; canceled → FREE', async () => {
    await sut.execute({ event: subscriptionEvent('ACTIVE', at(1)) })
    expect(plan()).toBe('PAID')
    expect(subscriptionsRepository.items[0].status).toBe('ACTIVE')

    await sut.execute({ event: subscriptionEvent('CANCELED', at(2)) })
    expect(plan()).toBe('FREE')
  })

  it('keeps PAID while PAST_DUE (payment being retried)', async () => {
    await sut.execute({ event: subscriptionEvent('PAST_DUE', at(1)) })

    expect(plan()).toBe('PAID')
  })

  it('ignores events older than the current state (out of order delivery)', async () => {
    await sut.execute({ event: subscriptionEvent('ACTIVE', at(5)) })
    const result = await sut.execute({ event: subscriptionEvent('CANCELED', at(1)) })

    expect(result.isRight() && result.value.applied).toBe(false)
    expect(plan()).toBe('PAID')
  })

  it('a late cancellation of an OLD subscription does not cancel the new one', async () => {
    await sut.execute({ event: subscriptionEvent('ACTIVE', at(5), 'sub_new') })
    await sut.execute({ event: subscriptionEvent('CANCELED', at(6), 'sub_old') })

    expect(plan()).toBe('PAID')
    expect(subscriptionsRepository.items[0].externalId).toBe('sub_new')
  })

  it('registers paid invoices only once (webhooks are retried)', async () => {
    const event: BillingEvent = {
      type: 'invoice.paid', eventId: 'evt_inv', occurredAt: at(1),
      externalCustomerId: 'cus_1', externalInvoiceId: 'in_1', amount: 2990, currency: 'brl',
    }

    await sut.execute({ event })
    const second = await sut.execute({ event })

    expect(paymentsRepository.items).toHaveLength(1)
    expect(paymentsRepository.items[0]).toMatchObject({ amount: 2990, status: 'SUCCEEDED', externalId: 'in_1' })
    expect(second.isRight() && second.value.applied).toBe(false)
  })

  it('returns ResourceNotFoundError for an unknown customer', async () => {
    const result = await sut.execute({ event: { ...subscriptionEvent('ACTIVE', at(1)), externalCustomerId: 'cus_unknown' } })

    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
