import { Injectable } from '@nestjs/common';
import { EmailSender } from '../../core/gateways/email-sender';
import { UserNotifier } from '../../domain/user/application/notifications/user-notifier';
import { EnvService } from '../env/env.service';

@Injectable()
export class EmailUserNotifier implements UserNotifier {
  constructor(
    private emailSender: EmailSender,
    private env: EnvService,
  ) { }

  async sendEmailVerification({ name, email, token }: { name: string; email: string; token: string }): Promise<void> {
    // O front lê o token da URL e chama POST /auth/verify-email
    const link = `${this.env.get('FRONTEND_URL')}/verify-email?token=${encodeURIComponent(token)}`;

    await this.emailSender.send({
      to: email,
      subject: 'Confirme seu e-mail — Playground de Engenheiro',
      text: `Olá, ${name}!\n\nConfirme seu e-mail pelo link abaixo (válido por 24 horas):\n${link}\n\nSe não foi você, ignore este e-mail.`,
      html: `
        <p>Olá, ${escapeHtml(name)}!</p>
        <p>Confirme seu e-mail para começar a usar o Playground de Engenheiro:</p>
        <p><a href="${link}">Confirmar e-mail</a></p>
        <p style="color:#666">O link vale por 24 horas. Se não foi você, ignore este e-mail.</p>
      `,
    });
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}
