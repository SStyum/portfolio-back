import { BadRequestException, Body, ConflictException, Controller, HttpCode, Post, UnauthorizedException, UsePipes } from "@nestjs/common";
import { CreateAccountUseCase } from "../../../domain/user/application/use-cases/create-user-use-case";
import { Public } from "../../auth/public";
import z from "zod";
import { ZodValidationPipe } from "../pipes/zod-validation-pipe";
import { UserAlreadyExistsError } from "../../../domain/user/application/use-cases/errors/user-already-exists-error";

const createAccountBodySchema = z.object({
  name: z.string(),
  email: z.string(),
  password: z.string(),
  payment: z.string().nullable()
})

type CreateAccountBodySchema = z.infer<typeof createAccountBodySchema>

@Controller('/signup')
export class CreateAccountController {
  constructor(
    private createAccountUseCase: CreateAccountUseCase
  ){}

  @Post()
  @Public()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createAccountBodySchema))
  async handle(
    @Body() body: CreateAccountBodySchema
  ){

    const {name, email, password, payment} = body

    const result = await this.createAccountUseCase.execute({
      name,
      email,
      password,
    })

    if(result.isLeft()){
      const error = result.value

      switch (error.constructor) {
        case UserAlreadyExistsError:
          throw new UnauthorizedException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

  }
}