import { AiMessage } from "../../../../core/DTO/Ai.message";

export abstract class AiService {
  abstract chat(messages: AiMessage[]): Promise<string>
}