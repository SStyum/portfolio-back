import { AggregateRoot } from "../../../../core/entities/aggregate-root";
import { UniqueEntityId } from "../../../../core/entities/unique-entity-id";
import { CommentCreatedEvent } from "../events/comment-created-event";

interface CommentProps {
  authorId: UniqueEntityId
  postId: UniqueEntityId
  content: string
  createdAt: Date
  updatedAt?: Date
}

export class Comment extends AggregateRoot<CommentProps> {
  get authorId() {
    return this.props.authorId
  }

  get postId() {
    return this.props.postId
  }

  get content() {
    return this.props.content
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  isAuthor(userId: string) {
    return this.props.authorId.toString() === userId
  }

  static create(props: Omit<CommentProps, 'createdAt'> & { createdAt?: Date }, id?: UniqueEntityId) {
    const comment = new Comment(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id
    )

    // Sem id = comentário novo (com id = vindo do banco, não é evento)
    const isNewComment = !id

    if (isNewComment) {
      comment.addDomainEvent(new CommentCreatedEvent(comment))
    }

    return comment
  }
}
