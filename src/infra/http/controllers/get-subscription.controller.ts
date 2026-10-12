import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SWAGGER_BEARER } from "../swagger/setup-swagger";
import { Controller, Get, NotFoundException } from "@nestjs/common";
import { GetSubscriptionUseCase } from "../../../domain/payment/application/use-cases/get-subscription-use-case";
import { CurrentUser } from "../../auth/current-user-decorator";
import { UserPayload } from "../../auth/jwt.strategy";
import { SubscriptionPresenter } from "../presenters/subscription-presenter";
import { PLAN_LIMITS } from "../../../domain/user/enterprise/plan-limits";

@ApiTags('Billing')
@ApiBearerAuth(SWAGGER_BEARER)
@Controller('/billing/subscription')
export class GetSubscriptionController {
  constructor(
    private getSubscriptionUseCase: GetSubscriptionUseCase,
  ) { }

  @ApiOperation({ summary: 'Plano, limites e assinatura do usuário' })
  @Get()
  async handle(
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.getSubscriptionUseCase.execute({
      userId: user.sub,
    })

    if (result.isLeft()) {
      throw new NotFoundException(result.value.message)
    }

    const { plan, subscription } = result.value

    return {
      plan,
      limits: PLAN_LIMITS[plan],
      subscription: subscription ? SubscriptionPresenter.toHTTP(subscription) : null,
    }
  }
}
