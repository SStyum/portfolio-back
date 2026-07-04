import { Injectable } from "@nestjs/common"
import { Either, left, right } from "../../../../core/either"
import { User } from "../../enterprise/entities/user"
import { UsersRepository } from "../repositories/users-respository"
import { ResourceNotFoundError } from "./errors/resource-not-found-error"

interface GetUserUseCaseRequest {
  id: string
}

type GetUserUseCaseResponse = Either<ResourceNotFoundError, {
  user: User
}>

@Injectable()
export class GetUserUseCase {
  constructor(private userRepository: UsersRepository) { }

  async execute({ id }: GetUserUseCaseRequest): Promise<GetUserUseCaseResponse> {
    const user = await this.userRepository.findById(id)

    if (!user) {
      return left(new ResourceNotFoundError())
    }

    return right({
      user
    })
  }
}