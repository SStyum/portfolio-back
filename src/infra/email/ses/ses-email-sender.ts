import { Injectable } from '@nestjs/common';
import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';
import { EmailSender, SendEmailInput } from '../../../core/gateways/email-sender';
import { EnvService } from '../../env/env.service';
import { awsClientConfig } from '../../aws/aws-client-config';

@Injectable()
export class SesEmailSender implements EmailSender {
  private readonly ses: SESv2Client;
  private readonly from: string;

  constructor(env: EnvService) {
    this.ses = new SESv2Client(awsClientConfig(env));
    this.from = env.get('EMAIL_FROM');
  }

  async send({ to, subject, html, text }: SendEmailInput): Promise<void> {
    await this.ses.send(new SendEmailCommand({
      FromEmailAddress: this.from,
      Destination: { ToAddresses: [to] },
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: {
            Html: { Data: html, Charset: 'UTF-8' },
            Text: { Data: text, Charset: 'UTF-8' },
          },
        },
      },
    }));
  }
}
