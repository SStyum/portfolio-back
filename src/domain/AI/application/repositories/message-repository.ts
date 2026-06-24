import { Message } from "../../enterprise/entity/message";

export abstract class MessageRepository {

    abstract create(message: Message): Promise<void>
    abstract findByChatId(chatId: string): Promise<Message[]>
}