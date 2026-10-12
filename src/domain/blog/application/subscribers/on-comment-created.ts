import { Injectable, Logger } from "@nestjs/common";
import { DomainEvents } from "../../../../core/events/domain-events";
import { EventHandler } from "../../../../core/events/event-handler";
import { MessagePublisher } from "../../../../core/gateways/message-publisher";
import { CommentCreatedEvent } from "../../enterprise/events/comment-created-event";
import { PostsRepository } from "../repositories/posts-repository";

export interface CommentCreatedMessage {
  commentId: string
  postId: string
  commentAuthorId: string
  // Quem deve ser notificado
  postAuthorId: string
  occurredAt: string
}

// Leva o evento de domínio pra fora do processo (RabbitMQ/SQS), pra quem quiser consumir (ex.: notificações)
@Injectable()
export class OnCommentCreated implements EventHandler {
  private readonly logger = new Logger(OnCommentCreated.name)

  constructor(
    private postsRepository: PostsRepository,
    private messagePublisher: MessagePublisher,
  ) {
    this.setupSubscriptions()
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      (event) => void this.publishCommentCreated(event as CommentCreatedEvent),
      CommentCreatedEvent.name,
    )
  }

  private async publishCommentCreated({ comment, ocurredAt }: CommentCreatedEvent) {
    try {
      const post = await this.postsRepository.findById(comment.postId.toString())

      if (!post) {
        return
      }

      await this.messagePublisher.publish<CommentCreatedMessage>({
        topic: 'comment.created',
        key: post.id.toString(),
        payload: {
          commentId: comment.id.toString(),
          postId: post.id.toString(),
          commentAuthorId: comment.authorId.toString(),
          postAuthorId: post.authorId.toString(),
          occurredAt: ocurredAt.toISOString(),
        },
      })
    } catch (error) {
      // O comentário já foi salvo: falha no broker não pode virar erro pro usuário.
      // Garantia de entrega fica pro Outbox Pattern (pendente).
      this.logger.error(`Failed to publish comment.created for ${comment.id.toString()}`, error as Error)
    }
  }
}
