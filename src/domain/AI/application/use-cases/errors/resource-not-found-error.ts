import { UseCaseError } from "../../../../../core/errors/use-case-error";

export class ResourceNotFoundError extends Error implements UseCaseError {
  constructor(resource: string) {
    super(`${resource} not found`)
  }
}
