import { AiMessage } from "../../../../core/DTO/Ai.message";

export interface AiGateway {

    chat(messages: AiMessage[]): Promise<string>

}