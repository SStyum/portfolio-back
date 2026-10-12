// O domínio diz O QUE avisar; a infra decide COMO (e-mail, template, link)
export abstract class UserNotifier {
  abstract sendEmailVerification(input: { name: string; email: string; token: string }): Promise<void>
}
