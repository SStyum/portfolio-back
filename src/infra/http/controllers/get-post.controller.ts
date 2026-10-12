import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { BadRequestException, Controller, Get, NotFoundException, Param, ParseUUIDPipe } from "@nestjs/common";
import { ResourceNotFoundError } from "../../../domain/blog/application/use-cases/errors/resource-not-found-error";
import { GetPostUseCase } from "../../../domain/blog/application/use-cases/get-post-use-case";
import { Public } from "../../auth/public";
import { PostPresenter } from "../presenters/post-presenter";

@ApiTags('Blog')
@Controller('/posts/:postId')
export class GetPostController {
  constructor(
    private getPostUseCase: GetPostUseCase
  ) { }

  @ApiOperation({ summary: 'Detalhe de um post' })
  @Get()
  @Public()
  async handle(
    @Param('postId', ParseUUIDPipe) postId: string
  ) {
    const result = await this.getPostUseCase.execute({
      postId
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
      post: PostPresenter.toHTTP(result.value.post)
    }
  }
}
