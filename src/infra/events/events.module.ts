import { Module } from '@nestjs/common';
import { OnCommentCreated } from '../../domain/blog/application/subscribers/on-comment-created';
import { DatabaseModule } from '../database/database.module';
import { MessagingModule } from '../messaging/messaging.module';
import { CryptographyModule } from '../cryptography/cryptography.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OnUserCreated } from '../../domain/user/application/subscribers/on-user-created';
import { SendEmailVerificationUseCase } from '../../domain/user/application/use-cases/send-email-verification-use-case';

// Subscribers dos eventos de domínio
@Module({
  imports: [DatabaseModule, MessagingModule, CryptographyModule, NotificationsModule],
  providers: [OnCommentCreated, OnUserCreated, SendEmailVerificationUseCase],
})
export class EventsModule {}
