import { UseCaseError } from "../../../../../core/errors/use-case-error";

export class AlreadySubscribedError extends Error implements UseCaseError {
  constructor() {
    super(`User already has an active subscription`)
  }
}
