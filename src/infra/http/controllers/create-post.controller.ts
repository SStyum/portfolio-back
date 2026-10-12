import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SWAGGER_BEARER } from "../swagger/setup-swagger";
import { ApiZodBody } from "../swagger/api-zod-body";
import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import z from "zod";
import { CreatePostUseCase } from "../../../domain/blog/application/use-cases/create-post-use-case";
import { CurrentUser } from "../../auth/current-user-decorator";
import { UserPayload } from "../../auth/jwt.strategy";
import { ZodValidationPipe } from "../pipes/zod-validation-pipe";
import { PostPresenter } from "../presenters/post-presenter";

const createPostBodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1),
})

type CreatePostBodySchema = z.infer<typeof createPostBodySchema>

@ApiTags('Blog')
@ApiBearerAuth(SWAGGER_BEARER)
@Controller('/posts')
export class CreatePostController {
  constructor(
    private createPostUseCase: CreatePostUseCase
  ) { }

  @ApiOperation({ summary: 'Cria um post' })
  @ApiZodBody(createPostBodySchema)
  @Post()
  @HttpCode(201)
  async handle(
    @CurrentUser() user: UserPayload,
    @Body(new ZodValidationPipe(createPostBodySchema)) body: CreatePostBodySchema
  ) {
    const { title, content } = body

    const result = await this.createPostUseCase.execute({
      authorId: user.sub,
      title,
      content
    })

    if (result.isLeft()) {
      throw new Error()
    }

    return {
      post: PostPresenter.toHTTP(result.value.post)
    }
  }
}
