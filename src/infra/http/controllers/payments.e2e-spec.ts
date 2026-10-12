import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { PaymentGateway } from '../../../domain/payment/application/gateway/payment.gateway'
import { PrismaService } from '../../database/prisma/prisma.service'
import { UserFactory } from '../../../../test/factories/make-user'
import { authenticate } from '../../../../test/utils/authenticate'
import { createE2EApp } from '../../../../test/utils/create-e2e-app'

let app: INestApplication
let prisma: PrismaService
let gateway: PaymentGateway
let userFactory: UserFactory

describe('Payments (E2E)', () => {
  beforeAll(async () => {
    const e2e = await createE2EApp()
    app = e2e.app
    userFactory = e2e.userFactory
    prisma = app.get(PrismaService)
    gateway = app.get(PaymentGateway)
  })

  afterAll(async () => {
    await app.close()
  })

  it('[POST] /payments stores the payment and returns the typed client payload', async () => {
    jest.spyOn(gateway, 'createPayment').mockResolvedValueOnce({
      externalId: 'pi_e2e',
      status: 'PENDING',
      clientPayload: { type: 'client_secret', clientSecret: 'pi_e2e_secret' },
    })
    const user = await userFactory.makePrismaUser()

    const response = await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${authenticate(app, user)}`)
      .send({ amount: 1990, currency: 'BRL' })

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      payment: { provider: 'STRIPE', amount: 1990, currency: 'brl', status: 'PENDING' },
      clientPayload: { type: 'client_secret', clientSecret: 'pi_e2e_secret' },
    })
    expect(await prisma.payment.findFirst({ where: { externalId: 'pi_e2e' } })).toMatchObject({ userId: user.id.toString() })
  })

  it('answers 502 when the payment API fails', async () => {
    jest.spyOn(gateway, 'createPayment').mockRejectedValueOnce(new Error('stripe down'))
    const user = await userFactory.makePrismaUser()

    const response = await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${authenticate(app, user)}`)
      .send({ amount: 1990, currency: 'brl' })

    expect(response.status).toBe(502)
  })

  it('validates the body', async () => {
    const user = await userFactory.makePrismaUser()

    const response = await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${authenticate(app, user)}`)
      .send({ amount: -1, currency: 'reais' })

    expect(response.status).toBe(400)
  })
})
