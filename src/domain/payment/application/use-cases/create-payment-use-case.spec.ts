import { InMemoryPaymentsRepository } from '../../../../../test/repositories/in-memory-payments-repository'
import { FakePaymentGateway } from '../../../../../test/fakes/fake-payment-gateway'
import { CreatePaymentUseCase } from './create-payment-use-case'
import { PaymentGatewayError } from './errors/payment-gateway-error'

let gateway: FakePaymentGateway
let paymentsRepository: InMemoryPaymentsRepository
let sut: CreatePaymentUseCase

describe('Create payment', () => {
  beforeEach(() => {
    gateway = new FakePaymentGateway()
    paymentsRepository = new InMemoryPaymentsRepository()
    sut = new CreatePaymentUseCase(gateway, paymentsRepository)
  })

  it('stores the payment with the gateway name and returns the client payload', async () => {
    const result = await sut.execute({ userId: 'user-1', amount: 1990, currency: 'brl' })

    expect(result.isRight()).toBe(true)
    expect(paymentsRepository.items[0]).toMatchObject({ provider: 'STRIPE', externalId: 'pi_fake', status: 'PENDING' })
    expect(result.isRight() && result.value.clientPayload).toEqual({ type: 'client_secret', clientSecret: 'secret_fake' })
  })

  it('returns PaymentGatewayError when the gateway fails (and stores nothing)', async () => {
    gateway.shouldFail = true

    const result = await sut.execute({ userId: 'user-1', amount: 1990, currency: 'brl' })

    expect(result.value).toBeInstanceOf(PaymentGatewayError)
    expect(paymentsRepository.items).toHaveLength(0)
  })
})
