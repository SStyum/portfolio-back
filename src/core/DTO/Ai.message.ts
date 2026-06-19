import { MessageRole } from "../VO/message.role";

export interface AiMessage{
    role: MessageRole,
    content: string
}