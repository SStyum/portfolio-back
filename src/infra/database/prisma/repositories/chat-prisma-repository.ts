import { Injectable } from "@nestjs/common";
import { ChatRepository } from "../../../../domain/IA/application/repositories/chat-repository";
import { PrismaService } from "../prisma.service";
import { Chat } from "../../../../domain/IA/enterprise/entity/chat";
import { PrismaChatMapper } from "../mapper/prisma-chat-mapper";

@Injectable()

export class PrismaChatRepository
implements ChatRepository{

    constructor(
        private prisma:PrismaService
    ){}


    async create(chat: Chat): Promise<void> {
        const data = PrismaChatMapper.toPrisma(chat)

        await this.prisma.chat.create({
            data
        })
    }


    async findById(id: string): Promise<Chat | null> {
        throw new Error("Method not implemented.");
    }

    async save(chat: Chat): Promise<void> {
        throw new Error("Method not implemented.");
    }

}