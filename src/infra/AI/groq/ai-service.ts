import { Injectable } from "@nestjs/common"
import { AiService } from "../../../domain/AI/application/gateway/ai.gateway"
import { ConfigService } from '@nestjs/config';
import { AiMessage } from "../../../core/DTO/Ai.message"
import { OpenAI } from 'openai'
import { Env } from "../../env/env";

@Injectable()
export class GroqProvider implements AiService {
  constructor(
    private env: ConfigService<Env, true>,
  ) {}

  async chat(messages: AiMessage[]) {
    const chat = new OpenAI({
      apiKey: this.env.get('GROQ_API_KEY'),
    })

    const completion =
      await chat.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
      })

    return (
      completion.choices[0].message.content ?? ''
    )
  }
}