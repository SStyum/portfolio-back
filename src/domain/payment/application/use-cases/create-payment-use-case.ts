import { Injectable } from '@nestjs/common';
import { PaymentClientPayload, PaymentGateway } from '../gateway/payment.gateway';
import { Either, left, right } from '../../../../core/either';
import { Payment } from '../../enterprise/entities/payment';
import { PaymentsRepository } from '../repository/payments-repository';
import { UniqueEntityId } from '../../../../core/entities/unique-entity-id';
import { PaymentGatewayError } from './errors/payment-gateway-error';

interface CreatePaymentUseCaseRequest {
  userId: string;
  amount: number;
  currency: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

type CreatePaymentUseCaseResponse = Either<PaymentGatewayError, {
  payment: Payment
  clientPayload: PaymentClientPayload
}>

@Injectable()
export class CreatePaymentUseCase {
  constructor(
    private readonly paymentGateway: PaymentGateway,
    private readonly paymentRepository: PaymentsRepository
  ) { }
  async execute({ userId, amount, currency, customerId, metadata }: CreatePaymentUseCaseRequest): Promise<CreatePaymentUseCaseResponse> {

    let result: Awaited<ReturnType<PaymentGateway['createPayment']>>

    try {
      result = await this.paymentGateway.createPayment({
        userId,
        amount,
        currency,
        customerId,
        metadata
      });
    } catch {
      return left(new PaymentGatewayError(this.paymentGateway.name))
    }

    const payment = Payment.create({
      userId: new UniqueEntityId(userId),
      provider: this.paymentGateway.name,
      externalId: result.externalId,
      externalCustomerId: result.externalCustomerId,
      amount: amount,
      currency: currency,
      status: result.status,
      metadata: metadata,
      createdAt: new Date(),
    });

    await this.paymentRepository.create(payment);

    // TODO Emitir evento, etc.
    return right({
      payment,
      clientPayload: result.clientPayload
    })
  }
}
