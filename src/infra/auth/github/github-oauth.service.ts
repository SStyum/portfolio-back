import { Injectable } from '@nestjs/common';
import { EnvService } from '../../env/env.service';

export interface GitHubProfile {
  providerAccountId: string
  name: string
  email?: string
  emailVerified: boolean
}

// Fluxo OAuth 2.0 (authorization code) do GitHub, sem SDK
@Injectable()
export class GitHubOAuthService {
  private readonly clientId?: string;
  private readonly clientSecret?: string;
  private readonly callbackUrl: string;

  constructor(env: EnvService) {
    this.clientId = env.get('GITHUB_CLIENT_ID');
    this.clientSecret = env.get('GITHUB_CLIENT_SECRET');
    this.callbackUrl = env.get('GITHUB_CALLBACK_URL');
  }

  get isConfigured() {
    return !!this.clientId && !!this.clientSecret;
  }

  getAuthorizationUrl(state: string) {
    const params = new URLSearchParams({
      client_id: this.clientId!,
      redirect_uri: this.callbackUrl,
      scope: 'read:user user:email',
      state,
      allow_signup: 'true',
    });

    return `https://github.com/login/oauth/authorize?${params}`;
  }

  async getProfile(code: string): Promise<GitHubProfile> {
    const accessToken = await this.exchangeCode(code);

    const [user, emails] = await Promise.all([
      this.api<{ id: number; login: string; name: string | null }>('/user', accessToken),
      this.api<{ email: string; primary: boolean; verified: boolean }[]>('/user/emails', accessToken),
    ]);

    const primary = emails.find((email) => email.primary);

    return {
      providerAccountId: String(user.id),
      name: user.name ?? user.login,
      email: primary?.email,
      emailVerified: primary?.verified ?? false,
    };
  }

  private async exchangeCode(code: string): Promise<string> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.callbackUrl,
      }),
    });

    const body = await response.json() as { access_token?: string; error?: string };

    if (!body.access_token) {
      throw new Error(`GitHub token exchange failed: ${body.error ?? response.status}`);
    }

    return body.access_token;
  }

  private async api<T>(path: string, accessToken: string): Promise<T> {
    const response = await fetch(`https://api.github.com${path}`, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'playground-de-engenheiro',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API ${path} failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }
}
