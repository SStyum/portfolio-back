import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { BadRequestException, Controller, Headers, HttpCode, Logger, Post, RawBodyRequest, Req } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import type { Request } from "express";
import { InvalidWebhookSignatureError, PaymentGateway } from "../../../domain/payment/application/gateway/payment.gateway";
import { HandleBillingEventUseCase } from "../../../domain/payment/application/use-cases/handle-billing-event-use-case";
import { Public } from "../../auth/public";

// Configure na API de pagamento: POST https://<api>/webhooks/billing
@ApiTags('Billing')
@Controller('/webhooks/billing')
export class BillingWebhookController {
  private readonly logger = new Logger(BillingWebhookController.name)

  constructor(
    private paymentGateway: PaymentGateway,
    private handleBillingEventUseCase: HandleBillingEventUseCase,
  ) { }

  @ApiOperation({ summary: 'Webhook da API de pagamento (assinatura validada no header)' })
  @Post()
  @Public()     // autenticado pela assinatura do webhook, não por JWT
  @SkipThrottle()
  @HttpCode(200)
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    if (!req.rawBody) {
      throw new BadRequestException('Missing body')
    }

    let event: Awaited<ReturnType<PaymentGateway['parseWebhookEvent']>>

    try {
      event = await this.paymentGateway.parseWebhookEvent(req.rawBody, headers)
    } catch (error) {
      if (error instanceof InvalidWebhookSignatureError) {
        throw new BadRequestException(error.message)
      }

      throw error
    }

    if (!event) {
      return { received: true }
    }

    const result = await this.handleBillingEventUseCase.execute({ event })

    // Cliente desconhecido: responde 200 mesmo assim, reenviar não resolveria
    if (result.isLeft()) {
      this.logger.warn(`Billing event ${event.eventId} ignored: ${result.value.message}`)
      return { received: true }
    }

    return { received: true }
  }
}
