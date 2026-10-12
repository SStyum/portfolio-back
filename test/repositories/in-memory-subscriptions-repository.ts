import { SubscriptionsRepository } from '../../src/domain/payment/application/repository/subscriptions-repository'
import { Subscription } from '../../src/domain/payment/enterprise/entities/subscription'

export class InMemorySubscriptionsRepository implements SubscriptionsRepository {
  public items: Subscription[] = []

  async findByUserId(userId: string) {
    return this.items.find((item) => item.userId.toString() === userId) ?? null
  }

  async save(subscription: Subscription) {
    const index = this.items.findIndex((item) => item.userId.equals(subscription.userId))

    if (index >= 0) {
      this.items[index] = subscription
    } else {
      this.items.push(subscription)
    }
  }
}
