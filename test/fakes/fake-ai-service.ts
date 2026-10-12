import { AiMessage } from '../../src/core/DTO/Ai.message'
import { AiService } from '../../src/domain/AI/application/gateway/ai.gateway'

export class FakeAiService implements AiService {
  public calls: AiMessage[][] = []

  async chat(messages: AiMessage[]) {
    this.calls.push(messages)
    return 'resposta da IA'
  }
}
