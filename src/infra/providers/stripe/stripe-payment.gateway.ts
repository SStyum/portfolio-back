import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { PaymentGateway, CreatePaymentInput, CreatePaymentOutput } from '../../../domain/payment/application/gateway/payment.gateway';
import { PaymentStatus } from '../../../domain/payment/enterprise/entities/payment';
import { EnvService } from '../../env/env.service';

@Injectable()
export class StripePaymentGateway implements PaymentGateway {
  readonly name = "STRIPE" as const;
  private readonly stripe: Stripe.Stripe;

  constructor(env: EnvService) {
    this.stripe = new Stripe(env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2026-07-29.dahlia',
    });
  }

  private mapStatus(status: Stripe.PaymentIntent.Status): PaymentStatus {
    switch (status) {
      case "requires_payment_method":
      case "requires_confirmation":
      case "requires_action":
      case "requires_capture":
        return "PENDING";

      case "processing":
        return "PROCESSING";

      case "succeeded":
        return "SUCCEEDED";

      case "canceled":
        return "CANCELED";

      default:
        return "FAILED";
    }
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentOutput> {
    const intent = await this.stripe.paymentIntents.create({
      amount: input.amount,
      currency: input.currency,
      customer: input.customerId,
      metadata: input.metadata ?? {},
      automatic_payment_methods: { enabled: true },
    });

    return {
      externalId: intent.id,
      externalCustomerId: typeof intent.customer === 'string'
        ? intent.customer
        : intent.customer?.id,
      status: this.mapStatus(intent.status),
      clientPayload: { clientSecret: intent.client_secret },
    };
  }

  async cancelPayment(externalId: string): Promise<void> {
    await this.stripe.paymentIntents.cancel(externalId);
  }
}
