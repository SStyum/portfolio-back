import { BadRequestException, Body, Controller, HttpCode, Post, UnauthorizedException, UsePipes } from "@nestjs/common";
import { z } from 'zod';
import { ZodValidationPipe } from "../pipes/zod-validation-pipe";
import { Public } from "../../auth/public";
import { WrongCredentialsError } from "../../../domain/user/application/use-cases/errors/wrong-credentials-error";
import { AuthenticateUserUseCase } from "../../../domain/user/application/use-cases/authenticate-user-use-case";

const authenticateBodySchema = z.object({
  email: z.string().email(),
  password: z.string()
})

type AuthenticateBodySchema = z.infer<typeof authenticateBodySchema>

@Controller('/sessions')
export class AuthenticateController {
  constructor(
    private authenticateUser: AuthenticateUserUseCase,
  ) { }

  @Post()
  @Public()
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(authenticateBodySchema))
  async handle(@Body() body: AuthenticateBodySchema) {

    const { email, password } = body

    const result = await this.authenticateUser.execute({
      email,
      password
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case WrongCredentialsError:
          throw new UnauthorizedException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    const { accessToken } = result.value

    return {
      access_token: accessToken,
    }
  }
}