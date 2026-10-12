import { PaymentsRepository } from '../../src/domain/payment/application/repository/payments-repository'
import { Payment, PaymentProviderName } from '../../src/domain/payment/enterprise/entities/payment'

export class InMemoryPaymentsRepository implements PaymentsRepository {
  public items: Payment[] = []

  async create(payment: Payment) {
    this.items.push(payment)
  }

  async findById(id: string) {
    return this.items.find((item) => item.id.toString() === id) ?? null
  }

  async findByExternalId(provider: PaymentProviderName, externalId: string) {
    return this.items.find((item) => item.provider === provider && item.externalId === externalId) ?? null
  }

  async findManyByUserId(userId: string) {
    return this.items.filter((item) => item.userId.toString() === userId)
  }

  async save(payment: Payment) {
    const index = this.items.findIndex((item) => item.id.equals(payment.id))
    this.items[index] = payment
  }
}
