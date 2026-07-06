import { Injectable, UnauthorizedException } from "@nestjs/common"
import { Either, left, right } from "../../../../core/either"
import { UsersRepository } from "../repositories/users-respository"
import { WrongCredentialsError } from "./errors/wrong-credentials-error"
import { EmailNotVerifiedError } from "./errors/email-not-verified-error"
import { User } from "../../enterprise/entities/user"
import { HashGenerator } from "../cryptography/hash-generator"
import { UserAlreadyExistsError } from "./errors/user-already-exists-error"


interface CreateAccountUseCaseRequest {
  name: string
  email: string
  password: string
  payment?: string
}

type CreateAccountUseCaseResponse = Either<
  UserAlreadyExistsError | UnauthorizedException,
  {
    user: User,
  }
>

@Injectable()
export class CreateAccountUseCase {

  constructor(
    private userRepository: UsersRepository,
    private hashGenerator: HashGenerator
  ) { }


  async execute({
    name,
    email,
    password,
    payment
  }: CreateAccountUseCaseRequest): Promise<CreateAccountUseCaseResponse> {
    const userAlreadyExists = await this.userRepository.findByEmail(email)

    const hashedPassword = await this.hashGenerator.hash(password)

    if (userAlreadyExists) {
      return left(new UserAlreadyExistsError(email))
    }

    const user = User.create({
      name,
      email,
      password: hashedPassword,
      payment
    })

    await this.userRepository.create(user)


    return right({
      user
    })

  }
}