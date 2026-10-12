import { Injectable } from "@nestjs/common"
import { Either, right } from "../../../../core/either"
import { EmailVerificationToken } from "../cryptography/email-verification-token"
import { UserNotifier } from "../notifications/user-notifier"
import { UsersRepository } from "../repositories/users-respository"

interface SendEmailVerificationUseCaseRequest {
  email: string
}

type SendEmailVerificationUseCaseResponse = Either<null, null>

@Injectable()
export class SendEmailVerificationUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private emailVerificationToken: EmailVerificationToken,
    private userNotifier: UserNotifier,
  ) { }

  async execute({ email }: SendEmailVerificationUseCaseRequest): Promise<SendEmailVerificationUseCaseResponse> {
    const user = await this.usersRepository.findByEmail(email)

    // Sempre "sucesso": não revela se o e-mail existe nem se já foi verificado
    if (!user || user.isEmailVerified) {
      return right(null)
    }

    const token = await this.emailVerificationToken.generate(user.id.toString())

    await this.userNotifier.sendEmailVerification({
      name: user.name,
      email: user.email,
      token,
    })

    return right(null)
  }
}
