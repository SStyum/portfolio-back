import { UserNotifier } from '../../src/domain/user/application/notifications/user-notifier'

export class FakeUserNotifier implements UserNotifier {
  public verifications: { name: string; email: string; token: string }[] = []

  async sendEmailVerification(input: { name: string; email: string; token: string }) {
    this.verifications.push(input)
  }
}
