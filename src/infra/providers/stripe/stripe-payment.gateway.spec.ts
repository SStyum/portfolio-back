import Stripe from 'stripe'
import { InvalidWebhookSignatureError } from '../../../domain/payment/application/gateway/payment.gateway'
import { EnvService } from '../../env/env.service'
import { StripePaymentGateway } from './stripe-payment.gateway'

const SECRET = 'whsec_test'
const env = { get: (key: string) => ({ STRIPE_SECRET_KEY: 'sk_test', STRIPE_WEBHOOK_SECRET: SECRET, STRIPE_PRICE_ID_PAID: 'price_1' })[key] } as unknown as EnvService
const gateway = new StripePaymentGateway(env)

function signed(event: object) {
  const payload = JSON.stringify(event)
  const header = new Stripe('sk_test').webhooks.generateTestHeaderString({ payload, secret: SECRET })
  return { body: Buffer.from(payload), headers: { 'stripe-signature': header } }
}

describe('Stripe gateway — webhooks', () => {
  it('translates subscription events to the domain format', async () => {
    const { body, headers } = signed({
      id: 'evt_1', type: 'customer.subscription.updated', created: 1_800_000_000,
      data: { object: { id: 'sub_1', customer: 'cus_1', status: 'past_due', cancel_at_period_end: true, items: { data: [{ current_period_end: 1_802_592_000 }] } } },
    })

    const event = await gateway.parseWebhookEvent(body, headers)

    expect(event).toEqual({
      type: 'subscription.updated',
      eventId: 'evt_1',
      occurredAt: new Date(1_800_000_000_000),
      externalCustomerId: 'cus_1',
      externalSubscriptionId: 'sub_1',
      status: 'PAST_DUE',
      currentPeriodEnd: new Date(1_802_592_000_000),
      cancelAtPeriodEnd: true,
    })
  })

  it.each([
    ['active', 'ACTIVE'], ['trialing', 'ACTIVE'], ['incomplete', 'INCOMPLETE'],
    ['canceled', 'CANCELED'], ['unpaid', 'CANCELED'], ['incomplete_expired', 'CANCELED'],
  ])('maps Stripe status %s → %s', async (stripeStatus, domainStatus) => {
    const { body, headers } = signed({
      id: 'evt', type: 'customer.subscription.updated', created: 1,
      data: { object: { id: 'sub', customer: 'cus', status: stripeStatus, cancel_at_period_end: false, items: { data: [] } } },
    })

    const event = await gateway.parseWebhookEvent(body, headers)

    expect(event).toMatchObject({ status: domainStatus })
  })

  it('translates invoice.paid', async () => {
    const { body, headers } = signed({
      id: 'evt_2', type: 'invoice.paid', created: 1,
      data: { object: { id: 'in_1', customer: { id: 'cus_1' }, amount_paid: 2990, currency: 'brl' } },
    })

    expect(await gateway.parseWebhookEvent(body, headers)).toMatchObject({
      type: 'invoice.paid', externalInvoiceId: 'in_1', externalCustomerId: 'cus_1', amount: 2990,
    })
  })

  it('ignores events the domain does not care about', async () => {
    const { body, headers } = signed({ id: 'evt_3', type: 'customer.created', created: 1, data: { object: {} } })

    expect(await gateway.parseWebhookEvent(body, headers)).toBeNull()
  })

  it('rejects forged or missing signatures', async () => {
    const { body } = signed({ id: 'evt', type: 'invoice.paid', created: 1, data: { object: {} } })

    await expect(gateway.parseWebhookEvent(body, { 'stripe-signature': 't=1,v1=forged' })).rejects.toBeInstanceOf(InvalidWebhookSignatureError)
    await expect(gateway.parseWebhookEvent(body, {})).rejects.toBeInstanceOf(InvalidWebhookSignatureError)
  })
})
