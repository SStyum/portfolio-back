import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from 'passport-jwt'
import { z } from "zod";
import { EnvService } from "../env/env.service";

// Exige `sub`: tokens de outros propósitos (verificação de e-mail, state do OAuth) não passam
const tokenPayloadSchema = z.object({
  sub: z.string().uuid(),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
})

export type UserPayload = z.infer<typeof tokenPayloadSchema>

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: EnvService) {
    const publicKey = config.get('JWT_PUBLIC_KEY')

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: Buffer.from(publicKey, 'base64'),
      algorithms: ['RS256']
    })
  }

  async validate(payload: UserPayload) {
    const result = tokenPayloadSchema.safeParse(payload)

    if (!result.success) {
      throw new UnauthorizedException('Invalid token payload')
    }

    // Tokens antigos sem "role" caem no default 'USER'
    return result.data
  }
}