import { EmailVerificationToken } from '../../src/domain/user/application/cryptography/email-verification-token'

export class FakeEmailVerificationToken implements EmailVerificationToken {
  async generate(userId: string) {
    return `verify:${userId}`
  }

  async verify(token: string) {
    return token.startsWith('verify:') ? { userId: token.slice('verify:'.length) } : null
  }
}
