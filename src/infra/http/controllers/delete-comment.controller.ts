import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SWAGGER_BEARER } from "../swagger/setup-swagger";
import { BadRequestException, Controller, Delete, ForbiddenException, HttpCode, NotFoundException, Param, ParseUUIDPipe } from "@nestjs/common";
import { DeleteCommentUseCase } from "../../../domain/blog/application/use-cases/delete-comment-use-case";
import { NotAllowedError } from "../../../domain/blog/application/use-cases/errors/not-allowed-error";
import { ResourceNotFoundError } from "../../../domain/blog/application/use-cases/errors/resource-not-found-error";
import { CurrentUser } from "../../auth/current-user-decorator";
import { UserPayload } from "../../auth/jwt.strategy";

@ApiTags('Blog')
@ApiBearerAuth(SWAGGER_BEARER)
@Controller('/comments/:commentId')
export class DeleteCommentController {
  constructor(
    private deleteCommentUseCase: DeleteCommentUseCase
  ) { }

  @ApiOperation({ summary: 'Apaga um comentário (só o autor)' })
  @Delete()
  @HttpCode(204)
  async handle(
    @CurrentUser() user: UserPayload,
    @Param('commentId', ParseUUIDPipe) commentId: string
  ) {
    const result = await this.deleteCommentUseCase.execute({
      authorId: user.sub,
      commentId
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        case NotAllowedError:
          throw new ForbiddenException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
