import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import {
  BillingEvent,
  CreateBillingPortalSessionInput,
  CreateCheckoutSessionInput,
  CreateCustomerInput,
  CreatePaymentInput,
  CreatePaymentOutput,
  InvalidWebhookSignatureError,
  PaymentGateway,
} from '../../../domain/payment/application/gateway/payment.gateway';
import { SubscriptionStatus } from '../../../domain/payment/enterprise/entities/subscription';
import { PaymentStatus } from '../../../domain/payment/enterprise/entities/payment';
import { EnvService } from '../../env/env.service';

@Injectable()
export class StripePaymentGateway implements PaymentGateway {
  readonly name = "STRIPE" as const;
  private readonly stripe: Stripe.Stripe;
  private readonly webhookSecret: string;
  private readonly paidPlanPriceId: string;

  constructor(env: EnvService) {
    this.stripe = new Stripe(env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2026-07-29.dahlia',
    });
    this.webhookSecret = env.get('STRIPE_WEBHOOK_SECRET')!;
    this.paidPlanPriceId = env.get('STRIPE_PRICE_ID_PAID')!;
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

    if (!intent.client_secret) {
      throw new Error(`Stripe PaymentIntent ${intent.id} sem client_secret`);
    }

    return {
      externalId: intent.id,
      externalCustomerId: typeof intent.customer === 'string'
        ? intent.customer
        : intent.customer?.id,
      status: this.mapStatus(intent.status),
      clientPayload: { type: 'client_secret', clientSecret: intent.client_secret },
    };
  }

  async cancelPayment(externalId: string): Promise<void> {
    await this.stripe.paymentIntents.cancel(externalId);
  }

  async createCustomer({ userId, name, email }: CreateCustomerInput): Promise<{ customerId: string }> {
    const customer = await this.stripe.customers.create({
      name,
      email,
      metadata: { userId },
    });

    return { customerId: customer.id };
  }

  async createCheckoutSession({ userId, customerId, successUrl, cancelUrl }: CreateCheckoutSessionInput): Promise<{ url: string }> {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: userId,
      line_items: [{ price: this.paidPlanPriceId, quantity: 1 }],
      subscription_data: { metadata: { userId } },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return { url: session.url! };
  }

  async createBillingPortalSession({ customerId, returnUrl }: CreateBillingPortalSessionInput): Promise<{ url: string }> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  async parseWebhookEvent(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): Promise<BillingEvent | null> {
    const signature = headers['stripe-signature'];

    if (typeof signature !== 'string') {
      throw new InvalidWebhookSignatureError();
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    } catch {
      throw new InvalidWebhookSignatureError();
    }

    const occurredAt = new Date(event.created * 1000);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const periodEnd = subscription.items.data[0]?.current_period_end;

        return {
          type: 'subscription.updated',
          eventId: event.id,
          occurredAt,
          externalCustomerId: this.customerId(subscription.customer),
          externalSubscriptionId: subscription.id,
          status: this.mapSubscriptionStatus(subscription.status),
          currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        };
      }

      case 'invoice.paid': {
        const invoice = event.data.object;

        if (!invoice.customer || !invoice.id) {
          return null;
        }

        return {
          type: 'invoice.paid',
          eventId: event.id,
          occurredAt,
          externalCustomerId: this.customerId(invoice.customer),
          externalInvoiceId: invoice.id,
          amount: invoice.amount_paid,
          currency: invoice.currency,
        };
      }

      default:
        return null;
    }
  }

  private customerId(customer: string | { id: string }): string {
    return typeof customer === 'string' ? customer : customer.id;
  }

  private mapSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
    switch (status) {
      case 'active':
      case 'trialing':
        return 'ACTIVE';

      case 'past_due':
        return 'PAST_DUE';

      case 'incomplete':
      case 'paused':
        return 'INCOMPLETE';

      default: // canceled, unpaid, incomplete_expired
        return 'CANCELED';
    }
  }
}
