import { Chat } from "../../enterprise/entity/chat";

export abstract class ChatRepository{
    abstract create(chat:Chat):Promise<void>
    abstract findById(id:string):Promise<Chat|null>
    abstract save(chat:Chat):Promise<void>
}