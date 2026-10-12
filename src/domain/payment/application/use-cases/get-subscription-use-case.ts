import { Injectable } from "@nestjs/common";
import { Either, left, right } from "../../../../core/either";
import { UsersRepository } from "../../../user/application/repositories/users-respository";
import { UserPlan } from "../../../user/enterprise/entities/user";
import { Subscription } from "../../enterprise/entities/subscription";
import { SubscriptionsRepository } from "../repository/subscriptions-repository";
import { ResourceNotFoundError } from "./errors/resource-not-found-error";

interface GetSubscriptionUseCaseRequest {
  userId: string
}

type GetSubscriptionUseCaseResponse = Either<ResourceNotFoundError, {
  plan: UserPlan
  subscription: Subscription | null
}>

@Injectable()
export class GetSubscriptionUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private subscriptionsRepository: SubscriptionsRepository,
  ) { }

  async execute({ userId }: GetSubscriptionUseCaseRequest): Promise<GetSubscriptionUseCaseResponse> {
    const user = await this.usersRepository.findById(userId)

    if (!user) {
      return left(new ResourceNotFoundError('User'))
    }

    const subscription = await this.subscriptionsRepository.findByUserId(userId)

    return right({
      plan: user.plan,
      subscription,
    })
  }
}
