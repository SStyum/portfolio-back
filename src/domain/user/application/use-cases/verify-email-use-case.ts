import { Injectable } from "@nestjs/common"
import { Either, left, right } from "../../../../core/either"
import { EmailVerificationToken } from "../cryptography/email-verification-token"
import { UsersRepository } from "../repositories/users-respository"
import { InvalidTokenError } from "./errors/invalid-token-error"

interface VerifyEmailUseCaseRequest {
  token: string
}

type VerifyEmailUseCaseResponse = Either<InvalidTokenError, null>

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private emailVerificationToken: EmailVerificationToken,
  ) { }

  async execute({ token }: VerifyEmailUseCaseRequest): Promise<VerifyEmailUseCaseResponse> {
    const payload = await this.emailVerificationToken.verify(token)

    if (!payload) {
      return left(new InvalidTokenError())
    }

    const user = await this.usersRepository.findById(payload.userId)

    if (!user) {
      return left(new InvalidTokenError())
    }

    if (!user.isEmailVerified) {
      user.verifyEmail()
      await this.usersRepository.save(user)
    }

    return right(null)
  }
}
