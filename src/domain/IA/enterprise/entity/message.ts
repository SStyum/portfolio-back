import { Entity } from "../../../../core/entities/entity"
import { UniqueEntityId } from "../../../../core/entities/unique-entity-id"

interface MessageProps {
    role: "user" | "assistant" | "system"

    content: string
    chatId: string
    createdAt: Date
}

export class Message extends Entity<MessageProps> {
    get content() {
        return this.props.content
    }

    get chatId() {
        return this.props.chatId
    }

    get createdAt() {
        return this.props.createdAt
    }

    get role() {
        return this.props.role
    }

    static create(props: MessageProps, id: UniqueEntityId) {
        const message = new Message(
            {
                ...props,
                createdAt: props.createdAt ?? new Date(),
            },
            id
        )

        return message
    }
}