import { Body, Controller, Param, Post } from "@nestjs/common"
import { SendMessageUseCase } from "../../../domain/AI/application/use-cases/send-message-use-case"

@Controller('/chat')
export class SendMessageController {
  constructor(
    private sendMessageUseCase:
      SendMessageUseCase,
  ) {}

  @Post('/:chatId/messages')
  async handle(
    @Param('chatId') chatId: string,
    @Body() body: { content: string },
  ) {
    const result =
      await this.sendMessageUseCase.execute({
        chatId,
        content: body.content,
      })

    return result
  }
}