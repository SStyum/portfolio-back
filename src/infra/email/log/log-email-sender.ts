import { Injectable, Logger } from '@nestjs/common';
import { EmailSender, SendEmailInput } from '../../../core/gateways/email-sender';

// Dev local: em vez de enviar, escreve o e-mail no log (o link de verificação aparece no terminal)
@Injectable()
export class LogEmailSender implements EmailSender {
  private readonly logger = new Logger('Email');

  async send({ to, subject, text }: SendEmailInput): Promise<void> {
    this.logger.log(`\nPara: ${to}\nAssunto: ${subject}\n\n${text}\n`);
  }
}
