import { Injectable } from "@nestjs/common";
import { SubscriptionsRepository } from "../../../../domain/payment/application/repository/subscriptions-repository";
import { Subscription } from "../../../../domain/payment/enterprise/entities/subscription";
import { PrismaSubscriptionMapper } from "../mapper/prisma-subscription-mapper";
import { PrismaService } from "../prisma.service";

@Injectable()
export class PrismaSubscriptionsRepository implements SubscriptionsRepository {

  constructor(private prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<Subscription | null> {
    const subscription = await this.prisma.subscription.findUnique({
      where: {
        userId
      }
    })

    if (!subscription) {
      return null
    }

    return PrismaSubscriptionMapper.toDomain(subscription)
  }

  async save(subscription: Subscription): Promise<void> {
    const data = PrismaSubscriptionMapper.toPrisma(subscription)

    await this.prisma.subscription.upsert({
      where: {
        userId: data.userId
      },
      create: data,
      update: data
    })
  }
}
