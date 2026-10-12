import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { EmailVerificationToken } from "../../domain/user/application/cryptography/email-verification-token";

const PURPOSE = 'email-verification'

// JWT assinado com a mesma chave do login, mas com outro formato:
// não tem `sub`, então a JwtStrategy recusa se alguém tentar usar como access token
@Injectable()
export class JwtEmailVerificationToken implements EmailVerificationToken {
  constructor(private jwtService: JwtService) { }

  generate(userId: string): Promise<string> {
    return this.jwtService.signAsync({ uid: userId, purpose: PURPOSE }, { expiresIn: '24h' })
  }

  async verify(token: string): Promise<{ userId: string } | null> {
    try {
      const payload = await this.jwtService.verifyAsync<{ uid?: string; purpose?: string }>(token)

      if (payload.purpose !== PURPOSE || !payload.uid) {
        return null
      }

      return { userId: payload.uid }
    } catch {
      return null
    }
  }
}
