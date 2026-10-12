import { Injectable } from "@nestjs/common"
import { Either, left, right } from "../../../../core/either"
import { UsersRepository } from "../repositories/users-respository"
import { WrongCredentialsError } from "./errors/wrong-credentials-error"
import { EmailNotVerifiedError } from "./errors/email-not-verified-error"
import { HashCompare } from "../cryptography/hash-compare"
import { Encrypter } from "../cryptography/encrypter"


interface AuthenticateUserUseCaseRequest {
  email: string
  password: string
}

type AuthenticateUserUseCaseResponse = Either<
  WrongCredentialsError | EmailNotVerifiedError,
  {
    accessToken: string,
  }
>

@Injectable()
export class AuthenticateUserUseCase {

  constructor(
    private userRepository: UsersRepository,
    private hashCompare: HashCompare,
    private encrypter: Encrypter
  ) { }


  async execute({
    email,
    password
  }: AuthenticateUserUseCaseRequest): Promise<AuthenticateUserUseCaseResponse> {
    const user = await this.userRepository.findByEmail(email)

    // Conta só com login social não tem senha
    if (!user || !user.hasPassword) {
      return left(new WrongCredentialsError())
    }

    const doesPasswordMatches = await this.hashCompare.compare(
      password,
      user.password
    )

    if(!doesPasswordMatches){
      return left(new WrongCredentialsError())
    }

    // Só depois da senha: não revela pra quem não sabe a senha se a conta existe
    if (!user.isEmailVerified) {
      return left(new EmailNotVerifiedError())
    }

    // O plano não vai no token: muda com o pagamento e é lido do banco quando precisa
    const accessToken = await this.encrypter.encrypt({
      sub: user.id.toString(),
      role: user.role,
    })

    return right({
      accessToken,
    })

  }
}