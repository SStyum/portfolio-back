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

    if (!user) {
      return left(new WrongCredentialsError())
    }

    const doesPasswordMatches = await this.hashCompare.compare(
      password,
      user.password
    )

    if(!doesPasswordMatches){
      return left(new WrongCredentialsError())
    }

    const accessToken = await this.encrypter.encrypt({
      sub: user.id.toString(),
    })

    return right({
      accessToken,
    })

  }
}