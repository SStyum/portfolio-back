import { UseCaseError } from "../../../../../core/errors/use-case-error";

export class EmailNotVerifiedError extends Error implements UseCaseError {
  constructor() {
    super("Email not verified. Please verify your email before logging in.")
  }
}
