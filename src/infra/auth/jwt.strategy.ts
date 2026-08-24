import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from 'passport-jwt'
import { z } from "zod";
import { EnvService } from "../env/env.service";

const tokenPayloadSchema = z.object({
  sub: z.string().uuid(),
  role: z.enum(['FREE', 'ADM']).default('FREE'),
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
    try {
      // Faz a validação com o Zod e garante o default 'FREE'
      const user = tokenPayloadSchema.parse(payload);

      // Caso o role não esteja presente, coloca o valor padrão
      if (!user.role) {
        user.role = 'FREE'; // Garantir que o role seja 'FREE'
      }

      return user;
    } catch (error) {
      // Caso falhe a validação, lançar erro
      throw new Error('Invalid token payload');
    }
  }
}