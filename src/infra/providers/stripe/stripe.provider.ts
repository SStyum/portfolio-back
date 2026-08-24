import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentProvider, CreatePaymentInput, CreatePaymentOutput } from '../../../core/repositories/payment-provider';
import { PaymentStatus } from '@prisma/client';


@Injectable()
export class StripeProvider implements PaymentProvider {
  private readonly stripe: Stripe.Stripe;

  constructor(private readonly config: ConfigService) {
    this.stripe = new Stripe(this.config.get<string>('stripe.secretKey')!, {
      apiVersion: '2026-07-29.dahlia',
    });
  }

   private mapStatus(status: string): PaymentStatus {
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
      paymentIntentId: intent.id,
      clientSecret: intent.client_secret!,
      status: this.mapStatus(intent.status),
      customerId: typeof intent.customer === 'string'
        ? intent.customer
        : intent.customer?.id,
    };
  }

  async cancelPayment(paymentIntentId: string): Promise<void> {
    await this.stripe.paymentIntents.cancel(paymentIntentId);
  }
}