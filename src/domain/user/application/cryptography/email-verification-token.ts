// Token de uso único pra confirmar o e-mail (expira sozinho)
export abstract class EmailVerificationToken {
  abstract generate(userId: string): Promise<string>
  // null = inválido ou expirado
  abstract verify(token: string): Promise<{ userId: string } | null>
}
