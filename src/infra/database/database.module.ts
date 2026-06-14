import { Module } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";
import { UsersRepository } from "../../domain/user/application/repositories/users-respository";
import { PrismaUserRepository } from "./prisma/repositories/user-prisma-repository";


@Module({
  imports:[

  ],
  providers:[
    PrismaService,
    {
      provide: UsersRepository,
      useClass: PrismaUserRepository
    }
  ],
  exports: [
    PrismaService,

    //payment
    

    //user
    UsersRepository
  ]
})

export class DatabaseModule{
  
}