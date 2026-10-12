import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Query } from "@nestjs/common";
import { FetchRecentPostsUseCase } from "../../../domain/blog/application/use-cases/fetch-recent-posts-use-case";
import { Public } from "../../auth/public";
import { pageQueryValidationPipe, type PageQueryParamSchema } from "../pipes/page-query";
import { PostPresenter } from "../presenters/post-presenter";

@ApiTags('Blog')
@Controller('/posts')
export class FetchRecentPostsController {
  constructor(
    private fetchRecentPostsUseCase: FetchRecentPostsUseCase
  ) { }

  @ApiOperation({ summary: 'Lista os posts mais recentes (20 por página)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @Get()
  @Public()
  async handle(
    @Query('page', pageQueryValidationPipe) page: PageQueryParamSchema
  ) {
    const result = await this.fetchRecentPostsUseCase.execute({
      page
    })

    if (result.isLeft()) {
      throw new Error()
    }

    return {
      posts: result.value.posts.map(PostPresenter.toHTTPSummary)
    }
  }
}
