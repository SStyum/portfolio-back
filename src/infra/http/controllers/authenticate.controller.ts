import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiZodBody } from "../swagger/api-zod-body";
import { Throttle } from "@nestjs/throttler";
import { BadRequestException, Body, Controller, ForbiddenException, HttpCode, Post, UnauthorizedException, UsePipes } from "@nestjs/common";
import { z } from 'zod';
import { ZodValidationPipe } from "../pipes/zod-validation-pipe";
import { Public } from "../../auth/public";
import { WrongCredentialsError } from "../../../domain/user/application/use-cases/errors/wrong-credentials-error";
import { EmailNotVerifiedError } from "../../../domain/user/application/use-cases/errors/email-not-verified-error";
import { AuthenticateUserUseCase } from "../../../domain/user/application/use-cases/authenticate-user-use-case";

const authenticateBodySchema = z.object({
  email: z.string().email(),
  password: z.string()
})

type AuthenticateBodySchema = z.infer<typeof authenticateBodySchema>

@ApiTags('Auth')
@Controller('/sessions')
export class AuthenticateController {
  constructor(
    private authenticateUser: AuthenticateUserUseCase,
  ) { }

  @ApiOperation({ summary: 'Login com e-mail e senha (retorna o JWT)' })
  @ApiZodBody(authenticateBodySchema)
  @Post()
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
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
        case EmailNotVerifiedError:
          throw new ForbiddenException(error.message)
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