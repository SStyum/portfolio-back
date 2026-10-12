// Para adicionar outro provedor (Resend, SendGrid...): inclua aqui e registre em email.module.ts
export const EMAIL_PROVIDERS = ["LOG", "SES"] as const;
export type EmailProviderName = typeof EMAIL_PROVIDERS[number];

export interface SendEmailInput {
  to: string
  subject: string
  html: string
  text: string
}

export abstract class EmailSender {
  abstract send(input: SendEmailInput): Promise<void>
}
