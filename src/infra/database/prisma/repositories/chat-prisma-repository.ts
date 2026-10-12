import { Injectable } from "@nestjs/common";
import { ChatRepository } from "../../../../domain/AI/application/repositories/chat-repository";
import { PrismaService } from "../prisma.service";
import { Chat } from "../../../../domain/AI/enterprise/entity/chat";
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
        const chat = await this.prisma.chat.findUnique({
            where: {
                id
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        })

        if (!chat) {
            return null
        }

        return PrismaChatMapper.toDomain(chat)
    }

    async save(chat: Chat): Promise<void> {
        await this.prisma.chat.update({
            where: {
                id: chat.id.toString()
            },
            data: {
                title: chat.title
            }
        })
    }

}