import { Injectable } from "@nestjs/common"
import { AiService } from "../../../domain/AI/application/gateway/ai.gateway"
import { ConfigService } from '@nestjs/config';
import { AiMessage } from "../../../core/DTO/Ai.message"
import { OpenAI } from 'openai'
import { Env } from "../../env/env";

@Injectable()
export class GroqProvider implements AiService {
  private readonly client: OpenAI

  constructor(
    env: ConfigService<Env, true>,
  ) {
    // API do Groq é compatível com a da OpenAI, só muda a URL
    this.client = new OpenAI({
      apiKey: env.get('GROQ_API_KEY'),
      baseURL: 'https://api.groq.com/openai/v1',
    })
  }

  async chat(messages: AiMessage[]) {
    const completion =
      await this.client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
      })

    return (
      completion.choices[0].message.content ?? ''
    )
  }
}