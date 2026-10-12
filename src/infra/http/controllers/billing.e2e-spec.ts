import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { PaymentGateway } from '../../../domain/payment/application/gateway/payment.gateway'
import { PrismaService } from '../../database/prisma/prisma.service'
import { UserFactory } from '../../../../test/factories/make-user'
import { authenticate } from '../../../../test/utils/authenticate'
import { createE2EApp } from '../../../../test/utils/create-e2e-app'
import { signedStripeEvent } from '../../../../test/utils/stripe-webhook'

let app: INestApplication
let prisma: PrismaService
let gateway: PaymentGateway
let userFactory: UserFactory

const now = () => Math.floor(Date.now() / 1000)

function subscriptionEvent(customer: string, status: string, created = now(), type = 'customer.subscription.updated') {
  return signedStripeEvent({
    type,
    created,
    data: {
      object: {
        id: `sub_${customer}`, object: 'subscription', customer, status, cancel_at_period_end: false,
        items: { data: [{ current_period_end: now() + 30 * 24 * 3600 }] },
      },
    },
  })
}

function sendWebhook({ payload, signature }: { payload: string; signature: string }) {
  return request(app.getHttpServer())
    .post('/webhooks/billing')
    .set('Content-Type', 'application/json')
    .set('Stripe-Signature', signature)
    .send(payload)
}

describe('Billing (E2E)', () => {
  beforeAll(async () => {
    const e2e = await createE2EApp()
    app = e2e.app
    userFactory = e2e.userFactory
    prisma = app.get(PrismaService)
    gateway = app.get(PaymentGateway)

    // Só as chamadas de rede da Stripe são substituídas; a validação do webhook é a real
    jest.spyOn(gateway, 'createCustomer').mockImplementation(async ({ userId }) => ({ customerId: `cus_${userId}` }))
    jest.spyOn(gateway, 'createCheckoutSession').mockResolvedValue({ url: 'https://checkout.stripe.test/session' })
    jest.spyOn(gateway, 'createBillingPortalSession').mockResolvedValue({ url: 'https://billing.stripe.test/portal' })
  })

  afterAll(async () => {
    await app.close()
  })

  it('[POST] /billing/checkout creates the customer first and returns the checkout URL', async () => {
    const user = await userFactory.makePrismaUser()

    const response = await request(app.getHttpServer())
      .post('/billing/checkout')
      .set('Authorization', `Bearer ${authenticate(app, user)}`)

    expect(response.status).toBe(201)
    expect(response.body).toEqual({ url: 'https://checkout.stripe.test/session' })
    expect((await prisma.user.findUnique({ where: { id: user.id.toString() } }))?.billingCustomerId).toBe(`cus_${user.id.toString()}`)
    // URLs de retorno vêm da config (FRONTEND_URL), não do cliente
    expect(gateway.createCheckoutSession).toHaveBeenLastCalledWith(expect.objectContaining({
      successUrl: 'http://front.e2e/billing/success',
      cancelUrl: 'http://front.e2e/billing',
    }))
  })

  it('[POST] /billing/checkout returns 409 for users already on PAID', async () => {
    const user = await userFactory.makePrismaUser({ plan: 'PAID' })

    const response = await request(app.getHttpServer()).post('/billing/checkout').set('Authorization', `Bearer ${authenticate(app, user)}`)

    expect(response.status).toBe(409)
  })

  it('[POST] /billing/portal needs a billing account', async () => {
    const withoutCustomer = await userFactory.makePrismaUser()
    const withCustomer = await userFactory.makePrismaUser({ billingCustomerId: 'cus_portal' })

    const missing = await request(app.getHttpServer()).post('/billing/portal').set('Authorization', `Bearer ${authenticate(app, withoutCustomer)}`)
    const ok = await request(app.getHttpServer()).post('/billing/portal').set('Authorization', `Bearer ${authenticate(app, withCustomer)}`)

    expect(missing.status).toBe(404)
    expect(ok.body).toEqual({ url: 'https://billing.stripe.test/portal' })
  })

  it('webhook: full subscription lifecycle (FREE → PAID → FREE)', async () => {
    const user = await userFactory.makePrismaUser({ billingCustomerId: 'cus_lifecycle' })
    const token = authenticate(app, user)
    const subscription = () => request(app.getHttpServer()).get('/billing/subscription').set('Authorization', `Bearer ${token}`)

    expect((await subscription()).body).toMatchObject({ plan: 'FREE', subscription: null, limits: { aiMessagesPerDay: 20 } })

    expect((await sendWebhook(subscriptionEvent('cus_lifecycle', 'active', now()))).status).toBe(200)
    expect((await subscription()).body).toMatchObject({
      plan: 'PAID',
      limits: { aiMessagesPerDay: 500 },
      subscription: { provider: 'STRIPE', status: 'ACTIVE', cancelAtPeriodEnd: false },
    })

    // Evento antigo chegando depois: ignorado
    await sendWebhook(subscriptionEvent('cus_lifecycle', 'canceled', now() - 3600))
    expect((await subscription()).body.plan).toBe('PAID')

    await sendWebhook(subscriptionEvent('cus_lifecycle', 'canceled', now() + 1, 'customer.subscription.deleted'))
    expect((await subscription()).body).toMatchObject({ plan: 'FREE', subscription: { status: 'CANCELED' } })
  })

  it('webhook: invoice.paid is stored once even if Stripe retries it', async () => {
    const user = await userFactory.makePrismaUser({ billingCustomerId: 'cus_invoice' })
    const event = signedStripeEvent({
      id: 'evt_invoice_1',
      type: 'invoice.paid',
      data: { object: { id: 'in_e2e', object: 'invoice', customer: 'cus_invoice', amount_paid: 2990, currency: 'brl' } },
    })

    await sendWebhook(event)
    await sendWebhook(event)

    const payments = await prisma.payment.findMany({ where: { userId: user.id.toString() } })
    expect(payments).toHaveLength(1)
    expect(payments[0]).toMatchObject({ externalId: 'in_e2e', amount: 2990, status: 'SUCCEEDED', eventId: 'evt_invoice_1' })
  })

  it('webhook: rejects forged signatures (400) and is public (no JWT)', async () => {
    const { payload } = subscriptionEvent('cus_x', 'active')

    const response = await sendWebhook({ payload, signature: 't=1,v1=forged' })

    expect(response.status).toBe(400)
  })

  it('webhook: unknown customers and irrelevant events answer 200 (no retry storm)', async () => {
    const unknown = await sendWebhook(subscriptionEvent('cus_nobody', 'active'))
    const irrelevant = await sendWebhook(signedStripeEvent({ type: 'customer.created', data: { object: {} } }))

    expect([unknown.status, irrelevant.status]).toEqual([200, 200])
  })
})
