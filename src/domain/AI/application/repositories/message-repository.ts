import { Message } from "../../enterprise/entity/message";

export abstract class MessageRepository {

    abstract create(message: Message): Promise<void>
    // Mais antigas primeiro; `limit` pega só as últimas N
    abstract findByChatId(chatId: string, limit?: number): Promise<Message[]>
    // Mensagens enviadas pelo usuário (role 'user') em todos os chats dele desde `since`
    abstract countUserMessagesSince(userId: string, since: Date): Promise<number>
}
