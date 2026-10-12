import { AggregateRoot } from "../../../../core/entities/aggregate-root";
import { UniqueEntityId } from "../../../../core/entities/unique-entity-id";

interface PostProps {
  authorId: UniqueEntityId
  title: string
  content: string
  createdAt: Date
  updatedAt?: Date
}

export class Post extends AggregateRoot<PostProps> {
  get authorId() {
    return this.props.authorId
  }

  get title() {
    return this.props.title
  }

  get content() {
    return this.props.content
  }

  get excerpt() {
    if (this.props.content.length <= 120) {
      return this.props.content
    }

    return this.props.content.substring(0, 120).trimEnd().concat('...')
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

  static create(props: Omit<PostProps, 'createdAt'> & { createdAt?: Date }, id?: UniqueEntityId) {
    return new Post(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id
    )
  }
}
