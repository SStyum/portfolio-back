import { UseCaseError } from "../../../../../core/errors/use-case-error";

export class PaymentGatewayError extends Error implements UseCaseError {
  constructor(provider: string) {
    super(`Could not create payment with ${provider}`)
  }
}
