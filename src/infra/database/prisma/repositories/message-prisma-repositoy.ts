import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { MessageRepository } from "../../../../domain/AI/application/repositories/message-repository";
import { Message } from "../../../../domain/AI/enterprise/entity/message";
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

    async findByChatId(chatId: string, limit?: number): Promise<Message[]> {
        // Busca as mais recentes e devolve em ordem cronológica
        const messages = await this.prisma.message.findMany({
            where: {
                chatId
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        })

        return messages.reverse().map(PrismaMessageMapper.toDomain)
    }

    async countUserMessagesSince(userId: string, since: Date): Promise<number> {
        return this.prisma.message.count({
            where: {
                role: 'user',
                createdAt: {
                    gte: since
                },
                chat: {
                    userId
                }
            }
        })
    }
}
