import { BadRequestException, Controller, Get, UseGuards } from "@nestjs/common";
import { GetUserUseCase } from "../../../domain/user/application/use-cases/get-user-use-case";
import { CurrentUser } from "../../auth/current-user-decorator";
import { JwtAuthGuard } from "../../auth/jwt-auth-guard";
import { UserPayload } from "../../auth/jwt.stratefy";
import { UserPresenter } from "../presenters/user-presenter";

@Controller('/me')
export class GetUserController {
  constructor(
    private getStudent: GetUserUseCase
  ) { }

  @Get()
  @UseGuards(JwtAuthGuard)
  async handle(
    @CurrentUser() user: UserPayload
  ) {

    const { sub: userId } = user

    const result = await this.getStudent.execute({
      id: userId
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    const userLogged = result.value.user;

    return {
      user: UserPresenter.toHTTP(userLogged)
    }
  }
}