import { Prisma, Subscription as PrismaSubscription } from '@prisma/client'
import { UniqueEntityId } from '../../../../core/entities/unique-entity-id'
import { Subscription } from '../../../../domain/payment/enterprise/entities/subscription'

export class PrismaSubscriptionMapper {
  static toDomain(raw: PrismaSubscription): Subscription {
    return Subscription.create({
      userId: new UniqueEntityId(raw.userId),
      provider: raw.provider,
      externalId: raw.externalId,
      status: raw.status,
      currentPeriodEnd: raw.currentPeriodEnd ?? undefined,
      cancelAtPeriodEnd: raw.cancelAtPeriodEnd,
      lastEventAt: raw.lastEventAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
      new UniqueEntityId(raw.id)
    )
  }

  static toPrisma(subscription: Subscription): Prisma.SubscriptionUncheckedCreateInput {
    return {
      id: subscription.id.toString(),
      userId: subscription.userId.toString(),
      provider: subscription.provider,
      externalId: subscription.externalId,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      lastEventAt: subscription.lastEventAt,
      createdAt: subscription.createdAt,
    }
  }
}
