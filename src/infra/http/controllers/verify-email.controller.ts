import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiZodBody } from "../swagger/api-zod-body";
import { BadRequestException, Body, Controller, HttpCode, Post } from "@nestjs/common";
import z from "zod";
import { VerifyEmailUseCase } from "../../../domain/user/application/use-cases/verify-email-use-case";
import { Public } from "../../auth/public";
import { ZodValidationPipe } from "../pipes/zod-validation-pipe";

const verifyEmailBodySchema = z.object({
  token: z.string().min(1),
})

type VerifyEmailBodySchema = z.infer<typeof verifyEmailBodySchema>

@ApiTags('Auth')
@Controller('/auth/verify-email')
export class VerifyEmailController {
  constructor(
    private verifyEmailUseCase: VerifyEmailUseCase,
  ) { }

  @ApiOperation({ summary: 'Confirma o e-mail com o token recebido' })
  @ApiZodBody(verifyEmailBodySchema)
  @Post()
  @Public()
  @HttpCode(204)
  async handle(
    @Body(new ZodValidationPipe(verifyEmailBodySchema)) body: VerifyEmailBodySchema,
  ) {
    const result = await this.verifyEmailUseCase.execute({ token: body.token })

    if (result.isLeft()) {
      throw new BadRequestException(result.value.message)
    }
  }
}
