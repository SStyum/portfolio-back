import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SWAGGER_BEARER } from "../swagger/setup-swagger";
import { BadRequestException, Controller, HttpCode, NotFoundException, Post } from "@nestjs/common";
import { CreateBillingPortalSessionUseCase } from "../../../domain/payment/application/use-cases/create-billing-portal-session-use-case";
import { NoBillingAccountError } from "../../../domain/payment/application/use-cases/errors/no-billing-account-error";
import { ResourceNotFoundError } from "../../../domain/payment/application/use-cases/errors/resource-not-found-error";
import { CurrentUser } from "../../auth/current-user-decorator";
import { UserPayload } from "../../auth/jwt.strategy";
import { EnvService } from "../../env/env.service";

@ApiTags('Billing')
@ApiBearerAuth(SWAGGER_BEARER)
@Controller('/billing/portal')
export class CreateBillingPortalSessionController {
  constructor(
    private createBillingPortalSessionUseCase: CreateBillingPortalSessionUseCase,
    private env: EnvService,
  ) { }

  @ApiOperation({ summary: 'Portal de cobrança: cartão, faturas, cancelamento' })
  @Post()
  @HttpCode(201)
  async handle(
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.createBillingPortalSessionUseCase.execute({
      userId: user.sub,
      returnUrl: `${this.env.get('FRONTEND_URL')}/billing`,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
        case NoBillingAccountError:
          throw new NotFoundException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    return {
      url: result.value.url
    }
  }
}
