import { Inject, Injectable } from '@nestjs/common';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
  CreatePaymentInput
} from '../../../../core/repositories/payment-provider';


@Injectable()
export class CreatePaymentUseCase {
  constructor(
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: PaymentProvider,
  ) { }

  async execute(input: CreatePaymentInput) {
    const result = await this.paymentProvider.createPayment(input);
    // TODO salvar no banco, emite evento, etc.
    return result;
  }
}