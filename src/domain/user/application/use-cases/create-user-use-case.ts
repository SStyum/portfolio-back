import { Injectable } from "@nestjs/common"
import { Either, left, right } from "../../../../core/either"
import { UsersRepository } from "../repositories/users-respository"
import { User } from "../../enterprise/entities/user"
import { HashGenerator } from "../cryptography/hash-generator"
import { UserAlreadyExistsError } from "./errors/user-already-exists-error"


interface CreateAccountUseCaseRequest {
  name: string
  email: string
  password: string
}

type CreateAccountUseCaseResponse = Either<
  UserAlreadyExistsError,
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
  }: CreateAccountUseCaseRequest): Promise<CreateAccountUseCaseResponse> {
    const userAlreadyExists = await this.userRepository.findByEmail(email)

    if (userAlreadyExists) {
      return left(new UserAlreadyExistsError(email))
    }

    const hashedPassword = await this.hashGenerator.hash(password)

    const user = User.create({
      name,
      email,
      password: hashedPassword,
    })

    await this.userRepository.create(user)


    return right({
      user
    })

  }
}
