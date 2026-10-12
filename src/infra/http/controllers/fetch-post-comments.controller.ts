import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { FetchPostCommentsUseCase } from "../../../domain/blog/application/use-cases/fetch-post-comments-use-case";
import { Public } from "../../auth/public";
import { pageQueryValidationPipe, type PageQueryParamSchema } from "../pipes/page-query";
import { CommentPresenter } from "../presenters/comment-presenter";

@ApiTags('Blog')
@Controller('/posts/:postId/comments')
export class FetchPostCommentsController {
  constructor(
    private fetchPostCommentsUseCase: FetchPostCommentsUseCase
  ) { }

  @ApiOperation({ summary: 'Lista os comentários de um post (20 por página)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @Get()
  @Public()
  async handle(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query('page', pageQueryValidationPipe) page: PageQueryParamSchema
  ) {
    const result = await this.fetchPostCommentsUseCase.execute({
      postId,
      page
    })

    if (result.isLeft()) {
      throw new Error()
    }

    return {
      comments: result.value.comments.map(CommentPresenter.toHTTP)
    }
  }
}
