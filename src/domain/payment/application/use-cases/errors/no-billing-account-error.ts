import { UseCaseError } from "../../../../../core/errors/use-case-error";

export class NoBillingAccountError extends Error implements UseCaseError {
  constructor() {
    super(`User has no billing account yet`)
  }
}
