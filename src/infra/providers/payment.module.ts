import { Module, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PaymentGateway } from '../../domain/payment/application/gateway/payment.gateway';
import { PaymentProviderName } from '../../domain/payment/enterprise/entities/payment';
import { EnvModule } from '../env/env.module';
import { EnvService } from '../env/env.service';
import { StripePaymentGateway } from './stripe/stripe-payment.gateway';

// Uma entrada por API. O Record força registrar todo provider declarado em PaymentProviderName.
const PAYMENT_GATEWAYS: Record<PaymentProviderName, Type<PaymentGateway>> = {
  STRIPE: StripePaymentGateway,
};

@Module({
  imports: [EnvModule],
  providers: [
    {
      provide: PaymentGateway,
      inject: [EnvService, ModuleRef],
      // Só instancia o gateway escolhido em PAYMENT_PROVIDER
      useFactory: (env: EnvService, moduleRef: ModuleRef) =>
        moduleRef.create(PAYMENT_GATEWAYS[env.get('PAYMENT_PROVIDER')]),
    },
  ],
  exports: [PaymentGateway],
})
export class PaymentModule {}
