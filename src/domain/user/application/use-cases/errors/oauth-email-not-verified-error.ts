import { UseCaseError } from "../../../../../core/errors/use-case-error";

export class OAuthEmailNotVerifiedError extends Error implements UseCaseError {
  constructor() {
    super(`Your provider account has no verified e-mail`)
  }
}
