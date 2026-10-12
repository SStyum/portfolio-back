import { Injectable } from "@nestjs/common";
import { Either, left, right } from "../../../../core/either";
import { UsersRepository } from "../../../user/application/repositories/users-respository";
import { PaymentGateway } from "../gateway/payment.gateway";
import { AlreadySubscribedError } from "./errors/already-subscribed-error";
import { ResourceNotFoundError } from "./errors/resource-not-found-error";

interface CreateCheckoutSessionUseCaseRequest {
  userId: string
  successUrl: string
  cancelUrl: string
}

type CreateCheckoutSessionUseCaseResponse = Either<ResourceNotFoundError | AlreadySubscribedError, {
  url: string
}>

@Injectable()
export class CreateCheckoutSessionUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private paymentGateway: PaymentGateway,
  ) { }

  async execute({ userId, successUrl, cancelUrl }: CreateCheckoutSessionUseCaseRequest): Promise<CreateCheckoutSessionUseCaseResponse> {
    const user = await this.usersRepository.findById(userId)

    if (!user) {
      return left(new ResourceNotFoundError('User'))
    }

    if (user.plan === 'PAID') {
      return left(new AlreadySubscribedError())
    }

    // O cliente é criado ANTES do checkout: assim todo webhook já encontra o usuário pelo customerId,
    // mesmo que os eventos cheguem fora de ordem
    if (!user.billingCustomerId) {
      const { customerId } = await this.paymentGateway.createCustomer({
        userId,
        name: user.name,
        email: user.email,
      })

      user.billingCustomerId = customerId
      await this.usersRepository.save(user)
    }

    const { url } = await this.paymentGateway.createCheckoutSession({
      userId,
      customerId: user.billingCustomerId!,
      successUrl,
      cancelUrl,
    })

    return right({
      url,
    })
  }
}
