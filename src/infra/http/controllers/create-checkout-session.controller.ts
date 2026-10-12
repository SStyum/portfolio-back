import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SWAGGER_BEARER } from "../swagger/setup-swagger";
import { BadRequestException, ConflictException, Controller, HttpCode, NotFoundException, Post } from "@nestjs/common";
import { CreateCheckoutSessionUseCase } from "../../../domain/payment/application/use-cases/create-checkout-session-use-case";
import { AlreadySubscribedError } from "../../../domain/payment/application/use-cases/errors/already-subscribed-error";
import { ResourceNotFoundError } from "../../../domain/payment/application/use-cases/errors/resource-not-found-error";
import { CurrentUser } from "../../auth/current-user-decorator";
import { UserPayload } from "../../auth/jwt.strategy";
import { EnvService } from "../../env/env.service";

@ApiTags('Billing')
@ApiBearerAuth(SWAGGER_BEARER)
@Controller('/billing/checkout')
export class CreateCheckoutSessionController {
  constructor(
    private createCheckoutSessionUseCase: CreateCheckoutSessionUseCase,
    private env: EnvService,
  ) { }

  @ApiOperation({ summary: 'Inicia a assinatura do plano PAID (retorna a URL do checkout)' })
  @Post()
  @HttpCode(201)
  async handle(
    @CurrentUser() user: UserPayload,
  ) {
    const frontendUrl = this.env.get('FRONTEND_URL')

    // URLs de retorno vêm da config, nunca do cliente (evita open redirect)
    const result = await this.createCheckoutSessionUseCase.execute({
      userId: user.sub,
      successUrl: `${frontendUrl}/billing/success`,
      cancelUrl: `${frontendUrl}/billing`,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        case AlreadySubscribedError:
          throw new ConflictException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    return {
      url: result.value.url
    }
  }
}
