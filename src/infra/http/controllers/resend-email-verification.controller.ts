import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiZodBody } from "../swagger/api-zod-body";
import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import z from "zod";
import { SendEmailVerificationUseCase } from "../../../domain/user/application/use-cases/send-email-verification-use-case";
import { Public } from "../../auth/public";
import { ZodValidationPipe } from "../pipes/zod-validation-pipe";

const resendEmailVerificationBodySchema = z.object({
  email: z.string().email(),
})

type ResendEmailVerificationBodySchema = z.infer<typeof resendEmailVerificationBodySchema>

@ApiTags('Auth')
@Controller('/auth/resend-verification')
export class ResendEmailVerificationController {
  constructor(
    private sendEmailVerificationUseCase: SendEmailVerificationUseCase,
  ) { }

  // Sempre 202, exista ou não a conta (não revela e-mails cadastrados)
  @ApiOperation({ summary: 'Reenvia o e-mail de verificação' })
  @ApiZodBody(resendEmailVerificationBodySchema)
  @Post()
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @HttpCode(202)
  async handle(
    @Body(new ZodValidationPipe(resendEmailVerificationBodySchema)) body: ResendEmailVerificationBodySchema,
  ) {
    await this.sendEmailVerificationUseCase.execute({ email: body.email })
  }
}
