import { InMemorySubscriptionsRepository } from '../../../../../test/repositories/in-memory-subscriptions-repository'
import { InMemoryUsersRepository } from '../../../../../test/repositories/in-memory-users-repository'
import { makeUser } from '../../../../../test/factories/make-user'
import { Subscription } from '../../enterprise/entities/subscription'
import { GetSubscriptionUseCase } from './get-subscription-use-case'

describe('Get subscription', () => {
  it('returns the plan and the subscription (or null)', async () => {
    const usersRepository = new InMemoryUsersRepository()
    const subscriptionsRepository = new InMemorySubscriptionsRepository()
    const sut = new GetSubscriptionUseCase(usersRepository, subscriptionsRepository)
    const free = makeUser()
    const paid = makeUser({ plan: 'PAID' })
    usersRepository.items.push(free, paid)
    subscriptionsRepository.items.push(Subscription.create({
      userId: paid.id, provider: 'STRIPE', externalId: 'sub_1', status: 'ACTIVE', cancelAtPeriodEnd: false, lastEventAt: new Date(),
    }))

    const freeResult = await sut.execute({ userId: free.id.toString() })
    const paidResult = await sut.execute({ userId: paid.id.toString() })

    expect(freeResult.isRight() && freeResult.value).toEqual({ plan: 'FREE', subscription: null })
    expect(paidResult.isRight() && paidResult.value.subscription?.status).toBe('ACTIVE')
  })
})
