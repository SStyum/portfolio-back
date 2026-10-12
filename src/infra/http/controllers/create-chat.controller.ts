import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SWAGGER_BEARER } from "../swagger/setup-swagger";
import {
  Controller,
  Post,
  HttpCode,
} from '@nestjs/common'

import { CreateChatUseCase } from '../../../domain/AI/application/use-cases/create-chat-use-case'
import { CurrentUser } from '../../auth/current-user-decorator'
import { UserPayload } from '../../auth/jwt.strategy'

@ApiTags('AI Chat')
@ApiBearerAuth(SWAGGER_BEARER)
@Controller('/chats')
export class CreateChatController {
  constructor(
    private createChatUseCase: CreateChatUseCase,
  ) {}

  @ApiOperation({ summary: 'Cria um chat com a IA' })
  @Post()
  @HttpCode(201)
  async handle(
    @CurrentUser() user: UserPayload,
  ) {
    const { sub: userId } = user

    const result = await this.createChatUseCase.execute({
      userId,
    })

    if (result.isLeft()) {
      throw new Error()
    }

    const { chat } = result.value

    return {
      chatId: chat.id.toString(),
      title: chat.title,
      createdAt: chat.createdAt,
    }
  }
}