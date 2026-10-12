import { DomainEvents } from '../../src/core/events/domain-events'
import { UsersRepository } from '../../src/domain/user/application/repositories/users-respository'
import { User } from '../../src/domain/user/enterprise/entities/user'

export class InMemoryUsersRepository implements UsersRepository {
  public items: User[] = []

  async create(user: User) {
    this.items.push(user)
    DomainEvents.dispatchEventsForAggregate(user.id)
  }

  async save(user: User) {
    const index = this.items.findIndex((item) => item.id.equals(user.id))
    this.items[index] = user
  }

  async findByEmail(email: string) {
    return this.items.find((item) => item.email === email) ?? null
  }

  async findById(id: string) {
    return this.items.find((item) => item.id.toString() === id) ?? null
  }

  async findByBillingCustomerId(billingCustomerId: string) {
    return this.items.find((item) => item.billingCustomerId === billingCustomerId) ?? null
  }
}
