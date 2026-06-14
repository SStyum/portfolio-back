import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { stripeConfig } from './stripe.config';
import { StripeProvider } from './stripe.provider';
import { PAYMENT_PROVIDER } from '../../../core/repositories/payment-provider';

@Module({
  imports: [ConfigModule.forFeature(stripeConfig)],
  providers: [
    {
      provide: PAYMENT_PROVIDER,   // ← injeta pelo símbolo, não pela classe
      useClass: StripeProvider,
    },
  ],
  exports: [PAYMENT_PROVIDER],
})
export class StripeModule {}