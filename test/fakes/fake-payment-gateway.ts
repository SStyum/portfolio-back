import {
  BillingEvent,
  CreateBillingPortalSessionInput,
  CreateCheckoutSessionInput,
  CreateCustomerInput,
  CreatePaymentInput,
  CreatePaymentOutput,
  PaymentGateway,
} from '../../src/domain/payment/application/gateway/payment.gateway'

export class FakePaymentGateway implements PaymentGateway {
  readonly name = 'STRIPE' as const

  public customers: CreateCustomerInput[] = []
  public checkouts: CreateCheckoutSessionInput[] = []
  public shouldFail = false

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentOutput> {
    if (this.shouldFail) {
      throw new Error('gateway down')
    }

    return {
      externalId: 'pi_fake',
      externalCustomerId: input.customerId,
      status: 'PENDING',
      clientPayload: { type: 'client_secret', clientSecret: 'secret_fake' },
    }
  }

  async cancelPayment() { }

  async createCustomer(input: CreateCustomerInput) {
    this.customers.push(input)
    return { customerId: `cus_${input.userId}` }
  }

  async createCheckoutSession(input: CreateCheckoutSessionInput) {
    this.checkouts.push(input)
    return { url: 'https://checkout.fake/session' }
  }

  async createBillingPortalSession(input: CreateBillingPortalSessionInput) {
    return { url: `https://portal.fake/${input.customerId}` }
  }

  async parseWebhookEvent(): Promise<BillingEvent | null> {
    return null
  }
}
