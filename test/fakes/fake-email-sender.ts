import { EmailSender, SendEmailInput } from '../../src/core/gateways/email-sender'

export class FakeEmailSender implements EmailSender {
  public sent: SendEmailInput[] = []

  async send(input: SendEmailInput) {
    this.sent.push(input)
  }

  lastTo(email: string) {
    return [...this.sent].reverse().find((message) => message.to === email)
  }
}
