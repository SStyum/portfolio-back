import { Injectable, Logger } from "@nestjs/common";
import { DomainEvents } from "../../../../core/events/domain-events";
import { EventHandler } from "../../../../core/events/event-handler";
import { UserCreatedEvent } from "../../enterprise/events/user-created-event";
import { SendEmailVerificationUseCase } from "../use-cases/send-email-verification-use-case";

// Conta nova com senha → manda o e-mail de verificação (login social já nasce verificado)
@Injectable()
export class OnUserCreated implements EventHandler {
  private readonly logger = new Logger(OnUserCreated.name)

  constructor(
    private sendEmailVerification: SendEmailVerificationUseCase,
  ) {
    this.setupSubscriptions()
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      (event) => void this.sendVerification(event as UserCreatedEvent),
      UserCreatedEvent.name,
    )
  }

  private async sendVerification({ user }: UserCreatedEvent) {
    if (user.isEmailVerified) {
      return
    }

    try {
      await this.sendEmailVerification.execute({ email: user.email })
    } catch (error) {
      // A conta já existe: o usuário pode pedir o reenvio em POST /auth/resend-verification
      this.logger.error(`Failed to send verification e-mail to user ${user.id.toString()}`, error as Error)
    }
  }
}
