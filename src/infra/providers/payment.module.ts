import { Module } from '@nestjs/common';
import { StripeModule } from './stripe/stripe.module';
import { CreatePaymentUseCase } from '../../domain/payment/application/use-cases/create-payment-use-case';

@Module({
  imports: [
    StripeModule,
  ],
  providers: [CreatePaymentUseCase],
  exports: [CreatePaymentUseCase],
})
export class PaymentModule {}