import { Module } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";

//Prisma-Repos
import { PrismaUserRepository } from "./prisma/repositories/user-prisma-repository";
import { PrismaMessageRepository } from "./prisma/repositories/message-prisma-repositoy";
import { PrismaPaymentsRepository } from "./prisma/repositories/payment-prisma-repository";
import { PrismaPostsRepository } from "./prisma/repositories/post-prisma-repository";
import { PrismaCommentsRepository } from "./prisma/repositories/comment-prisma-repository";
import { PrismaSubscriptionsRepository } from "./prisma/repositories/subscription-prisma-repository";
import { PrismaOAuthAccountsRepository } from "./prisma/repositories/oauth-account-prisma-repository";

//Domain-Repos
import { UsersRepository } from "../../domain/user/application/repositories/users-respository";
import { MessageRepository } from "../../domain/AI/application/repositories/message-repository";
import { ChatRepository } from "../../domain/AI/application/repositories/chat-repository";
import { PaymentsRepository } from "../../domain/payment/application/repository/payments-repository";
import { PostsRepository } from "../../domain/blog/application/repositories/posts-repository";
import { CommentsRepository } from "../../domain/blog/application/repositories/comments-repository";
import { SubscriptionsRepository } from "../../domain/payment/application/repository/subscriptions-repository";
import { OAuthAccountsRepository } from "../../domain/user/application/repositories/oauth-accounts-repository";
import { PrismaChatRepository } from "./prisma/repositories/chat-prisma-repository";


@Module({
  imports:[

  ],
  providers:[
    PrismaService,
    {
      provide: UsersRepository,
      useClass: PrismaUserRepository
    },
    {
      provide: MessageRepository,
      useClass: PrismaMessageRepository
    },
    {
      provide: ChatRepository,
      useClass: PrismaChatRepository
    },
    {
      provide: PaymentsRepository,
      useClass: PrismaPaymentsRepository
    },
    {
      provide: OAuthAccountsRepository,
      useClass: PrismaOAuthAccountsRepository
    },
    {
      provide: SubscriptionsRepository,
      useClass: PrismaSubscriptionsRepository
    },
    {
      provide: PostsRepository,
      useClass: PrismaPostsRepository
    },
    {
      provide: CommentsRepository,
      useClass: PrismaCommentsRepository
    }

  ],
  exports: [
    PrismaService,

    //payment
    PaymentsRepository,
    SubscriptionsRepository,

    //Blog
    PostsRepository,
    CommentsRepository,

    //Message
    MessageRepository,

    //Chat
    ChatRepository,

    //user
    UsersRepository,
    OAuthAccountsRepository
  ]
})

export class DatabaseModule{
  
}