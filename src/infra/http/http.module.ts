import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module';
import { AIModule } from '../AI/ai.module';
import { SendMessageController } from './controllers/send-message.controller';
import { SendMessageUseCase } from '../../domain/AI/application/use-cases/send-message-use-case';
import { AuthModule } from '../auth/auth.module';
import { AuthenticateController } from './controllers/authenticate.controller';
import { CreateAccountController } from './controllers/create-account.controller';
import { CreateChatController } from './controllers/create-chat.controller';
import { AuthenticateUserUseCase } from '../../domain/user/application/use-cases/authenticate-user-use-case';
import { CreateAccountUseCase } from '../../domain/user/application/use-cases/create-user-use-case';
import { CreateChatUseCase } from '../../domain/AI/application/use-cases/create-chat-use-case';
import { GetUserUseCase } from '../../domain/user/application/use-cases/get-user-use-case';
import { GetUserController } from './controllers/get-user.controller';
import { CryptographyModule } from '../cryptography/cryptography.module';
import { PaymentModule } from '../providers/payment.module';
import { StorageModule } from '../storage/storage.module';
import { MessagingModule } from '../messaging/messaging.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { GitHubAuthController } from './controllers/github-auth.controller';
import { VerifyEmailController } from './controllers/verify-email.controller';
import { ResendEmailVerificationController } from './controllers/resend-email-verification.controller';
import { GitHubOAuthService } from '../auth/github/github-oauth.service';
import { VerifyEmailUseCase } from '../../domain/user/application/use-cases/verify-email-use-case';
import { SendEmailVerificationUseCase } from '../../domain/user/application/use-cases/send-email-verification-use-case';
import { AuthenticateWithOAuthUseCase } from '../../domain/user/application/use-cases/authenticate-with-oauth-use-case';
import { CreateCheckoutSessionController } from './controllers/create-checkout-session.controller';
import { CreateBillingPortalSessionController } from './controllers/create-billing-portal-session.controller';
import { GetSubscriptionController } from './controllers/get-subscription.controller';
import { BillingWebhookController } from './controllers/billing-webhook.controller';
import { CreateCheckoutSessionUseCase } from '../../domain/payment/application/use-cases/create-checkout-session-use-case';
import { CreateBillingPortalSessionUseCase } from '../../domain/payment/application/use-cases/create-billing-portal-session-use-case';
import { GetSubscriptionUseCase } from '../../domain/payment/application/use-cases/get-subscription-use-case';
import { HandleBillingEventUseCase } from '../../domain/payment/application/use-cases/handle-billing-event-use-case';
import { EnvModule } from '../env/env.module';
import { CreatePostController } from './controllers/create-post.controller';
import { FetchRecentPostsController } from './controllers/fetch-recent-posts.controller';
import { GetPostController } from './controllers/get-post.controller';
import { DeletePostController } from './controllers/delete-post.controller';
import { CommentOnPostController } from './controllers/comment-on-post.controller';
import { FetchPostCommentsController } from './controllers/fetch-post-comments.controller';
import { DeleteCommentController } from './controllers/delete-comment.controller';
import { CreatePostUseCase } from '../../domain/blog/application/use-cases/create-post-use-case';
import { FetchRecentPostsUseCase } from '../../domain/blog/application/use-cases/fetch-recent-posts-use-case';
import { GetPostUseCase } from '../../domain/blog/application/use-cases/get-post-use-case';
import { DeletePostUseCase } from '../../domain/blog/application/use-cases/delete-post-use-case';
import { CommentOnPostUseCase } from '../../domain/blog/application/use-cases/comment-on-post-use-case';
import { FetchPostCommentsUseCase } from '../../domain/blog/application/use-cases/fetch-post-comments-use-case';
import { DeleteCommentUseCase } from '../../domain/blog/application/use-cases/delete-comment-use-case';
import { CreatePaymentController } from './controllers/create-payment.controller';
import { CreatePaymentUseCase } from '../../domain/payment/application/use-cases/create-payment-use-case';

@Module({
  imports: [
    DatabaseModule,
    AIModule,
    AuthModule,
    CryptographyModule,
    PaymentModule,
    StorageModule,
    MessagingModule,
    EnvModule,
    NotificationsModule
  ],
  controllers: [
    //User
    AuthenticateController,
    CreateAccountController,
    GetUserController,
    GitHubAuthController,
    VerifyEmailController,
    ResendEmailVerificationController,

    //chat
    SendMessageController,
    CreateChatController,

    //Payment
    CreatePaymentController,
    CreateCheckoutSessionController,
    CreateBillingPortalSessionController,
    GetSubscriptionController,
    BillingWebhookController,

    //Blog
    CreatePostController,
    FetchRecentPostsController,
    GetPostController,
    DeletePostController,
    CommentOnPostController,
    FetchPostCommentsController,
    DeleteCommentController
  ],
  providers: [
    SendMessageUseCase,

    //User
    AuthenticateUserUseCase,
    CreateAccountUseCase,
    GetUserUseCase,
    VerifyEmailUseCase,
    SendEmailVerificationUseCase,
    AuthenticateWithOAuthUseCase,
    GitHubOAuthService,

    //AI
    CreateChatUseCase,

    //Payment
    CreatePaymentUseCase,
    CreateCheckoutSessionUseCase,
    CreateBillingPortalSessionUseCase,
    GetSubscriptionUseCase,
    HandleBillingEventUseCase,

    //Blog
    CreatePostUseCase,
    FetchRecentPostsUseCase,
    GetPostUseCase,
    DeletePostUseCase,
    CommentOnPostUseCase,
    FetchPostCommentsUseCase,
    DeleteCommentUseCase,
  ],
})

export class HttpModule {}