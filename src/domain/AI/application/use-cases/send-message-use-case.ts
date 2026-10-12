import { Injectable } from "@nestjs/common"
import { Either, left, right } from "../../../../core/either"
import { Message } from "../../enterprise/entity/message"
import { ChatRepository } from "../repositories/chat-repository"
import { MessageRepository } from "../repositories/message-repository"
import { AiService } from "../gateway/ai.gateway"
import { NotAllowedError } from "./errors/not-allowed-error"
import { ResourceNotFoundError } from "./errors/resource-not-found-error"
import { QuotaExceededError } from "./errors/quota-exceeded-error"
import { UsersRepository } from "../../../user/application/repositories/users-respository"
import { PLAN_LIMITS } from "../../../user/enterprise/plan-limits"

// Contexto mandado pra IA: limita custo/tokens em chats longos
const HISTORY_LIMIT = 20

interface SendMessageUseCaseRequest {
  userId: string
  chatId: string
  content: string
}

type SendMessageUseCaseResponse = Either<ResourceNotFoundError | NotAllowedError | QuotaExceededError, {
  answer: string
}>

@Injectable()
export class SendMessageUseCase {
  constructor(
    private chatsRepository: ChatRepository,
    private messagesRepository: MessageRepository,
    private aiProvider: AiService,
    private usersRepository: UsersRepository,
  ) { }

  async execute({
    userId,
    chatId,
    content,
  }: SendMessageUseCaseRequest): Promise<SendMessageUseCaseResponse> {

    const chat = await this.chatsRepository.findById(chatId)

    if (!chat) {
      return left(new ResourceNotFoundError('Chat'))
    }

    if (chat.userId !== userId) {
      return left(new NotAllowedError())
    }

    // Plano lido do banco (não do JWT): muda na hora em que o webhook confirma o pagamento
    const user = await this.usersRepository.findById(userId)

    if (!user) {
      return left(new ResourceNotFoundError('User'))
    }

    const { aiMessagesPerDay } = PLAN_LIMITS[user.plan]
    const startOfDay = new Date()
    startOfDay.setUTCHours(0, 0, 0, 0)

    const sentToday = await this.messagesRepository.countUserMessagesSince(userId, startOfDay)

    if (sentToday >= aiMessagesPerDay) {
      return left(new QuotaExceededError(aiMessagesPerDay))
    }

    const userMessage = Message.create({
      role: 'user',
      content,
      chatId,
      createdAt: new Date(),
    })

    await this.messagesRepository.create(userMessage)

    const history =
      await this.messagesRepository.findByChatId(chatId, HISTORY_LIMIT)

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
