import type { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { User } from '../../src/domain/user/enterprise/entities/user'

// Gera um access token igual ao do login, sem passar pelo POST /sessions
export function authenticate(app: INestApplication, user: User) {
  return app.get(JwtService).sign({ sub: user.id.toString(), role: user.role })
}
