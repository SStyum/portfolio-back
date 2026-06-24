import { Entity } from "../../../../core/entities/entity"
import { UniqueEntityId } from "../../../../core/entities/unique-entity-id"

interface MemoryProps {
    userId: string
    content: string
    embedding: number[]
    importance: number
    lastAccess?: Date
    createdAt?: Date
}

export class Memory extends Entity<MemoryProps> {
    get userId() {
        return this.props.userId
    }

    get content() {
        return this.props.content
    }

    get embedding() {
        return this.props.embedding
    }

    get importance() {
        return this.props.importance
    }

    get lastAccess() {
        return this.props.lastAccess
    }

    get createdAt() {
        return this.props.createdAt
    }

    static create(props: MemoryProps, id:UniqueEntityId){
        const memory = new Memory(
            {
                ...props,
                createdAt: props.createdAt ?? new Date(),
                lastAccess: props.lastAccess ?? new Date()
            }
        )
    }
}