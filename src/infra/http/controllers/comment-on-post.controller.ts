import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SWAGGER_BEARER } from "../swagger/setup-swagger";
import { ApiZodBody } from "../swagger/api-zod-body";
import { BadRequestException, Body, Controller, HttpCode, NotFoundException, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import z from "zod";
import { CommentOnPostUseCase } from "../../../domain/blog/application/use-cases/comment-on-post-use-case";
import { ResourceNotFoundError } from "../../../domain/blog/application/use-cases/errors/resource-not-found-error";
import { CurrentUser } from "../../auth/current-user-decorator";
import { UserPayload } from "../../auth/jwt.strategy";
import { ZodValidationPipe } from "../pipes/zod-validation-pipe";
import { CommentPresenter } from "../presenters/comment-presenter";

const commentOnPostBodySchema = z.object({
  content: z.string().trim().min(1).max(2000),
})

type CommentOnPostBodySchema = z.infer<typeof commentOnPostBodySchema>

@ApiTags('Blog')
@ApiBearerAuth(SWAGGER_BEARER)
@Controller('/posts/:postId/comments')
export class CommentOnPostController {
  constructor(
    private commentOnPostUseCase: CommentOnPostUseCase
  ) { }

  @ApiOperation({ summary: 'Comenta em um post' })
  @ApiZodBody(commentOnPostBodySchema)
  @Post()
  @HttpCode(201)
  async handle(
    @CurrentUser() user: UserPayload,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body(new ZodValidationPipe(commentOnPostBodySchema)) body: CommentOnPostBodySchema
  ) {
    const result = await this.commentOnPostUseCase.execute({
      authorId: user.sub,
      postId,
      content: body.content
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    return {
      comment: CommentPresenter.toHTTP(result.value.comment)
    }
  }
}
