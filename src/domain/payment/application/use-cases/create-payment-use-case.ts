import { Inject, Injectable } from '@nestjs/common';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
  CreatePaymentInput
} from '../../../../core/repositories/payment-provider';
import { Either, right } from '../../../../core/either';
import { Payment } from '../../enterprise/entities/payment';
import { PaymentsRepository } from '../repository/payments-repository';
import { UniqueEntityId } from '../../../../core/entities/unique-entity-id';
import { StripeStatusMapper } from '../../../../core/utils/mapper/payment.status.mapper';

interface CreatePaymentUseCaseRequest {
  userId: string;
  amount: number;
  currency: string;
  customerId?: string;
  metadata?: Record<string, string>;

}

type CreatePaymentUseCaseResponse = Either<null, {
  payment: Payment
}>



@Injectable()
export class CreatePaymentUseCase {
  constructor(
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: PaymentProvider,
    private readonly paymentRepository: PaymentsRepository
  ) { }
  async execute({ userId, amount, currency, customerId, metadata }: CreatePaymentUseCaseRequest): Promise <CreatePaymentUseCaseResponse> {

    const result = await this.paymentProvider.createPayment({
      userId,
      amount,
      currency,
      customerId,
      metadata
    });

    const payment = Payment.create({
      userId: new UniqueEntityId(userId),
      provider: "STRIPE",
      stripePaymentIntentId: result.paymentIntentId,
      stripeCustomerId: result.customerId,
      amount: amount,
      currency: currency,
      status: StripeStatusMapper.toDomain(result.status),
      metadata: metadata,
      eventId: "",
      createdAt: new Date(),
    });

    await this.paymentRepository.create(payment);

    // TODO Emitir evento, etc.
    return right({
      payment,
      clientSecret: result.clientSecret
    })
  }
}