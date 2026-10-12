import { Module } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";

//Prisma-Repos
import { PrismaUserRepository } from "./prisma/repositories/user-prisma-repository";
import { PrismaMessageRepository } from "./prisma/repositories/message-prisma-repositoy";
import { PrismaPaymentsRepository } from "./prisma/repositories/payment-prisma-repository";

//Domain-Repos
import { UsersRepository } from "../../domain/user/application/repositories/users-respository";
import { MessageRepository } from "../../domain/AI/application/repositories/message-repository";
import { ChatRepository } from "../../domain/AI/application/repositories/chat-repository";
import { PaymentsRepository } from "../../domain/payment/application/repository/payments-repository";
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
    }

  ],
  exports: [
    PrismaService,

    //payment
    PaymentsRepository,

    //Message
    MessageRepository,

    //Chat
    ChatRepository,

    //user
    UsersRepository
  ]
})

export class DatabaseModule{
  
}