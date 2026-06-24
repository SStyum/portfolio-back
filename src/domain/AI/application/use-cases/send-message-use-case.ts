import { Injectable } from "@nestjs/common"
import { Either, right } from "../../../../core/either"
import { Message } from "../../enterprise/entity/message"
import { ChatRepository } from "../repositories/chat-repository"
import { MessageRepository } from "../repositories/message-repository"
import { AiService } from "../gateway/ai.gateway"


interface SendMessageUseCaseRequest {
  chatId: string
  content: string
}

type SendMessageUseCaseResponse = Either<null, {
  answer: string
}>

@Injectable()
export class SendMessageUseCase {
  constructor(
    private chatsRepository: ChatRepository,
    private messagesRepository: MessageRepository,
    private aiProvider: AiService,
  ) { }

  async execute({
    chatId,
    content,
  }: SendMessageUseCaseRequest): Promise<SendMessageUseCaseResponse> {

    const chat = await this.chatsRepository.findById(chatId)

    if (!chat) {
      throw new Error('Chat not found')
    }

    const userMessage = Message.create({
      role: 'user',
      content,
      chatId,
      createdAt: new Date(),
    })

    await this.messagesRepository.create(userMessage)

    const history =
      await this.messagesRepository.findByChatId(chatId)

    const aiMessages = history.map(message => ({
      role: message.role,
      content: message.content,
    }))

    const answer =
      await this.aiProvider.chat(aiMessages)

    const assistantMessage = Message.create({
      role: 'assistant',
      content: answer,
      chatId,
      createdAt: new Date(),
    })

    await this.messagesRepository.create(
      assistantMessage,
    )

    return right({
      answer,
    })
  }
}