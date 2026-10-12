import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiZodBody } from "../swagger/api-zod-body";
import { Throttle } from "@nestjs/throttler";
import { BadRequestException, Body, ConflictException, Controller, HttpCode, Post, UsePipes } from "@nestjs/common";
import { CreateAccountUseCase } from "../../../domain/user/application/use-cases/create-user-use-case";
import { Public } from "../../auth/public";
import z from "zod";
import { ZodValidationPipe } from "../pipes/zod-validation-pipe";
import { UserAlreadyExistsError } from "../../../domain/user/application/use-cases/errors/user-already-exists-error";

const createAccountBodySchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  password: z.string().min(8),
})

type CreateAccountBodySchema = z.infer<typeof createAccountBodySchema>

@ApiTags('Auth')
@Controller('/signup')
export class CreateAccountController {
  constructor(
    private createAccountUseCase: CreateAccountUseCase
  ){  }

  @ApiOperation({ summary: 'Cria uma conta (envia e-mail de verificação)' })
  @ApiZodBody(createAccountBodySchema)
  @Post()
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createAccountBodySchema))
  async handle(
    @Body() body: CreateAccountBodySchema
  ){

    const {name, email, password} = body

    const result = await this.createAccountUseCase.execute({
      name,
      email,
      password,
    })

    if(result.isLeft()){
      const error = result.value

      switch (error.constructor) {
        case UserAlreadyExistsError:
          throw new ConflictException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

  }
}