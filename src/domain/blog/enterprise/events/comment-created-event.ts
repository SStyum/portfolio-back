import { UniqueEntityId } from "../../../../core/entities/unique-entity-id";
import { DomainEvent } from "../../../../core/events/domain-event";
import { Comment } from "../entities/comment";

export class CommentCreatedEvent implements DomainEvent {
  public ocurredAt: Date
  public comment: Comment

  constructor(comment: Comment) {
    this.comment = comment
    this.ocurredAt = new Date()
  }

  getAggregateId(): UniqueEntityId {
    return this.comment.id
  }
}
