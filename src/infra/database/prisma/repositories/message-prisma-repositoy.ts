import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { MessageRepository } from "../../../../domain/IA/application/repositories/message-repository";
import { Message } from "../../../../domain/IA/enterprise/entity/message";
import { PrismaMessageMapper } from "../mapper/prisma-message-mapper";

@Injectable()

export class PrismaMessageRepository
    implements MessageRepository {

    constructor(
        private prisma: PrismaService
    ) { }

    async create(message: Message): Promise<void> {
        const data = PrismaMessageMapper.toPrisma(message)

        await this.prisma.message.create({
            data
        })
    }

    async findByChatId(chatId: string): Promise<Message[]> {
        throw new Error("Method not implemented.");
    }


}