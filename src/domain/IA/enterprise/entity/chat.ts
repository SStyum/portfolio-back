import { Entity } from "../../../../core/entities/entity"
import { UniqueEntityId } from "../../../../core/entities/unique-entity-id"
import { Message } from "./message"

interface ChatProps {
  title: string
  userId: string
  messages: Message[]
  createdAt?: Date
}


export class Chat extends Entity<ChatProps> {
  get title() {
    return this.props.title
  }

  get userId() {
    return this.props.userId
  }

  get messages(){
    return this.messages
  }

  get createdAt() {
    return this.props.createdAt
  }

  static create(props: ChatProps, id?: UniqueEntityId) {
    const chat = new Chat(
      {
        ...props,
        createdAt: props.createdAt ?? new Date()
      },
      id
    )

    return chat
  }
}


