import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Logger, Query, Req, Res, ServiceUnavailableException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { AuthenticateWithOAuthUseCase } from "../../../domain/user/application/use-cases/authenticate-with-oauth-use-case";
import { GitHubOAuthService } from "../../auth/github/github-oauth.service";
import { Public } from "../../auth/public";
import { EnvService } from "../../env/env.service";

const STATE_COOKIE = 'oauth_state'
const STATE_PURPOSE = 'oauth-state'

@ApiTags('Auth')
@Controller('/auth/github')
@Public()
@Throttle({ default: { ttl: 60_000, limit: 10 } })
export class GitHubAuthController {
  private readonly logger = new Logger(GitHubAuthController.name)

  constructor(
    private github: GitHubOAuthService,
    private authenticateWithOAuth: AuthenticateWithOAuthUseCase,
    private jwtService: JwtService,
    private env: EnvService,
  ) { }

  // 1. O front manda o usuário pra cá; daqui ele vai pro GitHub
  @ApiOperation({ summary: 'Inicia o login com GitHub (redireciona)' })
  @Get()
  async redirectToGitHub(@Res() res: Response) {
    if (!this.github.isConfigured) {
      throw new ServiceUnavailableException('GitHub login is not configured')
    }

    // `state` assinado + o mesmo nonce num cookie: o callback só aceita quem começou o fluxo
    // neste navegador (protege contra login CSRF)
    const nonce = randomBytes(16).toString('hex')
    const state = await this.jwtService.signAsync({ purpose: STATE_PURPOSE, nonce }, { expiresIn: '10m' })

    res.cookie(STATE_COOKIE, nonce, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.env.get('FRONTEND_URL').startsWith('https://'),
      maxAge: 10 * 60 * 1000,
      path: '/auth/github',
    })

    res.redirect(this.github.getAuthorizationUrl(state))
  }

  // 2. O GitHub devolve o usuário pra cá com ?code&state
  @ApiOperation({ summary: 'Callback do GitHub (redireciona pro front com o token)' })
  @Get('/callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const frontendUrl = this.env.get('FRONTEND_URL')
    const fail = (reason: string) => res.redirect(`${frontendUrl}/login?error=${reason}`)

    res.clearCookie(STATE_COOKIE, { path: '/auth/github' })

    if (!code || !state || !(await this.isValidState(state, readCookie(req, STATE_COOKIE)))) {
      return fail('invalid_state')
    }

    let profile: Awaited<ReturnType<GitHubOAuthService['getProfile']>>

    try {
      profile = await this.github.getProfile(code)
    } catch (error) {
      this.logger.warn(`GitHub login failed: ${(error as Error).message}`)
      return fail('github_error')
    }

    const result = await this.authenticateWithOAuth.execute({
      provider: 'GITHUB',
      ...profile,
    })

    if (result.isLeft()) {
      return fail('email_not_verified')
    }

    // Token no fragmento (#): não vai pro servidor do front nem fica em log de acesso
    res.redirect(`${frontendUrl}/auth/callback#access_token=${result.value.accessToken}`)
  }

  private async isValidState(state: string, cookieNonce: string | undefined) {
    if (!cookieNonce) {
      return false
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ purpose?: string; nonce?: string }>(state)

      return payload.purpose === STATE_PURPOSE
        && !!payload.nonce
        && payload.nonce.length === cookieNonce.length
        && timingSafeEqual(Buffer.from(payload.nonce), Buffer.from(cookieNonce))
    } catch {
      return false
    }
  }
}

function readCookie(req: Request, name: string): string | undefined {
  const match = req.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))

  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined
}
