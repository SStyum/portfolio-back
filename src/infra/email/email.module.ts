import { Module, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { EmailProviderName, EmailSender } from '../../core/gateways/email-sender';
import { EnvModule } from '../env/env.module';
import { EnvService } from '../env/env.service';
import { LogEmailSender } from './log/log-email-sender';
import { SesEmailSender } from './ses/ses-email-sender';

// Uma entrada por provedor. O Record força registrar todo provider declarado em EmailProviderName.
const EMAIL_SENDERS: Record<EmailProviderName, Type<EmailSender>> = {
  LOG: LogEmailSender,
  SES: SesEmailSender,
};

@Module({
  imports: [EnvModule],
  providers: [
    {
      provide: EmailSender,
      inject: [EnvService, ModuleRef],
      // Só instancia o provedor escolhido em EMAIL_PROVIDER
      useFactory: (env: EnvService, moduleRef: ModuleRef) =>
        moduleRef.create(EMAIL_SENDERS[env.get('EMAIL_PROVIDER')]),
    },
  ],
  exports: [EmailSender],
})
export class EmailModule {}
