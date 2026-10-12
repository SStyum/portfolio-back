import { Injectable } from "@nestjs/common";
import { Either, left, right } from "../../../../core/either";
import { UsersRepository } from "../../../user/application/repositories/users-respository";
import { PaymentGateway } from "../gateway/payment.gateway";
import { NoBillingAccountError } from "./errors/no-billing-account-error";
import { ResourceNotFoundError } from "./errors/resource-not-found-error";

interface CreateBillingPortalSessionUseCaseRequest {
  userId: string
  returnUrl: string
}

type CreateBillingPortalSessionUseCaseResponse = Either<ResourceNotFoundError | NoBillingAccountError, {
  url: string
}>

// Portal da API de pagamento: trocar cartão, ver faturas, cancelar
@Injectable()
export class CreateBillingPortalSessionUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private paymentGateway: PaymentGateway,
  ) { }

  async execute({ userId, returnUrl }: CreateBillingPortalSessionUseCaseRequest): Promise<CreateBillingPortalSessionUseCaseResponse> {
    const user = await this.usersRepository.findById(userId)

    if (!user) {
      return left(new ResourceNotFoundError('User'))
    }

    if (!user.billingCustomerId) {
      return left(new NoBillingAccountError())
    }

    const { url } = await this.paymentGateway.createBillingPortalSession({
      customerId: user.billingCustomerId,
      returnUrl,
    })

    return right({
      url,
    })
  }
}
