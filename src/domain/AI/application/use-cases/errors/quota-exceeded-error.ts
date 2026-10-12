import { UseCaseError } from "../../../../../core/errors/use-case-error";

export class QuotaExceededError extends Error implements UseCaseError {
  constructor(limit: number) {
    super(`Daily AI message limit reached (${limit}). Upgrade your plan or try again tomorrow.`)
  }
}
