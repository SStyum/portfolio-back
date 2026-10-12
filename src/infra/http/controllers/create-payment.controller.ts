import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SWAGGER_BEARER } from "../swagger/setup-swagger";
import { ApiZodBody } from "../swagger/api-zod-body";
import { BadGatewayException, BadRequestException, Body, Controller, HttpCode, Post } from "@nestjs/common";
import z from "zod";
import { CreatePaymentUseCase } from "../../../domain/payment/application/use-cases/create-payment-use-case";
import { PaymentGatewayError } from "../../../domain/payment/application/use-cases/errors/payment-gateway-error";
import { CurrentUser } from "../../auth/current-user-decorator";
import { UserPayload } from "../../auth/jwt.strategy";
import { ZodValidationPipe } from "../pipes/zod-validation-pipe";
import { PaymentPresenter } from "../presenters/payment-presenter";

const createPaymentBodySchema = z.object({
  amount: z.number().int().positive(), // em centavos
  currency: z.string().length(3).toLowerCase(),
  metadata: z.record(z.string(), z.string()).optional()
})

type CreatePaymentBodySchema = z.infer<typeof createPaymentBodySchema>

@ApiTags('Payments')
@ApiBearerAuth(SWAGGER_BEARER)
@Controller('/payments')
export class CreatePaymentController {
  constructor(
    private createPaymentUseCase: CreatePaymentUseCase
  ) { }

  @ApiOperation({ summary: 'Cria um pagamento avulso' })
  @ApiZodBody(createPaymentBodySchema)
  @Post()
  @HttpCode(201)
  async handle(
    @CurrentUser() user: UserPayload,
    @Body(new ZodValidationPipe(createPaymentBodySchema)) body: CreatePaymentBodySchema
  ) {
    const { sub: userId } = user
    const { amount, currency, metadata } = body

    const result = await this.createPaymentUseCase.execute({
      userId,
      amount,
      currency,
      metadata
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case PaymentGatewayError:
          throw new BadGatewayException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    const { payment, clientPayload } = result.value

    return {
      payment: PaymentPresenter.toHTTP(payment),
      clientPayload
    }
  }
}
