import { Module } from '@nestjs/common';
import { UserNotifier } from '../../domain/user/application/notifications/user-notifier';
import { EmailModule } from '../email/email.module';
import { EnvModule } from '../env/env.module';
import { EmailUserNotifier } from './email-user-notifier';

@Module({
  imports: [EmailModule, EnvModule],
  providers: [{ provide: UserNotifier, useClass: EmailUserNotifier }],
  exports: [UserNotifier],
})
export class NotificationsModule {}
