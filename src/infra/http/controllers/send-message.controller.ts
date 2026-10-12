import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SWAGGER_BEARER } from "../swagger/setup-swagger";
import { ApiZodBody } from "../swagger/api-zod-body";
import { Throttle } from "@nestjs/throttler";
import { BadRequestException, Body, Controller, ForbiddenException, HttpException, HttpStatus, NotFoundException, Param, ParseUUIDPipe, Post } from "@nestjs/common"
import z from "zod"
import { SendMessageUseCase } from "../../../domain/AI/application/use-cases/send-message-use-case"
import { NotAllowedError } from "../../../domain/AI/application/use-cases/errors/not-allowed-error"
import { ResourceNotFoundError } from "../../../domain/AI/application/use-cases/errors/resource-not-found-error"
import { QuotaExceededError } from "../../../domain/AI/application/use-cases/errors/quota-exceeded-error"
import { CurrentUser } from "../../auth/current-user-decorator"
import { UserPayload } from "../../auth/jwt.strategy"
import { ZodValidationPipe } from "../pipes/zod-validation-pipe"

const sendMessageBodySchema = z.object({
  content: z.string().trim().min(1).max(4000),
})

type SendMessageBodySchema = z.infer<typeof sendMessageBodySchema>

@ApiTags('AI Chat')
@ApiBearerAuth(SWAGGER_BEARER)
@Controller('/chat')
export class SendMessageController {
  constructor(
    private sendMessageUseCase:
      SendMessageUseCase,
  ) {}

  @ApiOperation({ summary: 'Envia uma mensagem e recebe a resposta da IA (sujeito à cota do plano)' })
  @ApiZodBody(sendMessageBodySchema)
  @Post('/:chatId/messages')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async handle(
    @CurrentUser() user: UserPayload,
    @Param('chatId', ParseUUIDPipe) chatId: string,
    @Body(new ZodValidationPipe(sendMessageBodySchema)) body: SendMessageBodySchema,
  ) {
    const result =
      await this.sendMessageUseCase.execute({
        userId: user.sub,
        chatId,
        content: body.content,
      })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        case NotAllowedError:
          throw new ForbiddenException(error.message)
        case QuotaExceededError:
          throw new HttpException(error.message, HttpStatus.TOO_MANY_REQUESTS)
        default:
          throw new BadRequestException(error.message)
      }
    }

    return {
      answer: result.value.answer,
    }
  }
}
