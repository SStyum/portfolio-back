import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SWAGGER_BEARER } from "../swagger/setup-swagger";
import { BadRequestException, Controller, Delete, ForbiddenException, HttpCode, NotFoundException, Param, ParseUUIDPipe } from "@nestjs/common";
import { NotAllowedError } from "../../../domain/blog/application/use-cases/errors/not-allowed-error";
import { ResourceNotFoundError } from "../../../domain/blog/application/use-cases/errors/resource-not-found-error";
import { DeletePostUseCase } from "../../../domain/blog/application/use-cases/delete-post-use-case";
import { CurrentUser } from "../../auth/current-user-decorator";
import { UserPayload } from "../../auth/jwt.strategy";

@ApiTags('Blog')
@ApiBearerAuth(SWAGGER_BEARER)
@Controller('/posts/:postId')
export class DeletePostController {
  constructor(
    private deletePostUseCase: DeletePostUseCase
  ) { }

  @ApiOperation({ summary: 'Apaga um post (só o autor)' })
  @Delete()
  @HttpCode(204)
  async handle(
    @CurrentUser() user: UserPayload,
    @Param('postId', ParseUUIDPipe) postId: string
  ) {
    const result = await this.deletePostUseCase.execute({
      authorId: user.sub,
      postId
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
