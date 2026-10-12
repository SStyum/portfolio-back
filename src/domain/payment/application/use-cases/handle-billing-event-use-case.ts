import { Injectable } from "@nestjs/common";
import { Either, left, right } from "../../../../core/either";
import { UniqueEntityId } from "../../../../core/entities/unique-entity-id";
import { UsersRepository } from "../../../user/application/repositories/users-respository";
import { Payment } from "../../enterprise/entities/payment";
import { Subscription } from "../../enterprise/entities/subscription";
import { BillingEvent, PaymentGateway } from "../gateway/payment.gateway";
import { PaymentsRepository } from "../repository/payments-repository";
import { SubscriptionsRepository } from "../repository/subscriptions-repository";
import { ResourceNotFoundError } from "./errors/resource-not-found-error";

interface HandleBillingEventUseCaseRequest {
  event: BillingEvent
}

type HandleBillingEventUseCaseResponse = Either<ResourceNotFoundError, {
  // false = evento repetido ou mais antigo que o estado atual (nada mudou)
  applied: boolean
}>

/**
 * Aplica eventos de cobrança vindos do webhook.
 * Idempotente: a API reenvia eventos e eles podem chegar fora de ordem.
 */
@Injectable()
export class HandleBillingEventUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private subscriptionsRepository: SubscriptionsRepository,
    private paymentsRepository: PaymentsRepository,
    private paymentGateway: PaymentGateway,
  ) { }

  async execute({ event }: HandleBillingEventUseCaseRequest): Promise<HandleBillingEventUseCaseResponse> {
    const user = await this.usersRepository.findByBillingCustomerId(event.externalCustomerId)

    if (!user) {
      return left(new ResourceNotFoundError('User'))
    }

    if (event.type === 'invoice.paid') {
      const alreadyRegistered = await this.paymentsRepository.findByExternalId(this.paymentGateway.name, event.externalInvoiceId)

      if (alreadyRegistered) {
        return right({ applied: false })
      }

      await this.paymentsRepository.create(Payment.create({
        userId: user.id,
        provider: this.paymentGateway.name,
        externalId: event.externalInvoiceId,
        externalCustomerId: event.externalCustomerId,
        amount: event.amount,
        currency: event.currency,
        status: 'SUCCEEDED',
        eventId: event.eventId,
        createdAt: event.occurredAt,
      }))

      return right({ applied: true })
    }

    const update = {
      externalId: event.externalSubscriptionId,
      status: event.status,
      currentPeriodEnd: event.currentPeriodEnd,
      cancelAtPeriodEnd: event.cancelAtPeriodEnd,
      lastEventAt: event.occurredAt,
    }

    let subscription = await this.subscriptionsRepository.findByUserId(user.id.toString())

    if (!subscription) {
      subscription = Subscription.create({
        userId: user.id,
        provider: this.paymentGateway.name,
        ...update,
      })
    } else {
      const isSameSubscription = subscription.externalId === event.externalSubscriptionId

      // Evento atrasado da mesma assinatura: não pode desfazer um estado mais novo
      if (isSameSubscription && event.occurredAt < subscription.lastEventAt) {
        return right({ applied: false })
      }

      // Cancelamento de uma assinatura antiga não derruba a assinatura nova
      if (!isSameSubscription && event.status === 'CANCELED') {
        return right({ applied: false })
      }

      subscription.apply(update)
    }

    await this.subscriptionsRepository.save(subscription)

    user.changePlan(subscription.grantsPaidPlan ? 'PAID' : 'FREE')
    await this.usersRepository.save(user)

    return right({ applied: true })
  }
}
