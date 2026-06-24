import { Entity } from "../../../../core/entities/entity"
import { UniqueEntityId } from "../../../../core/entities/unique-entity-id"


interface KnowledgeProps {
    title: string
    content: string
    embedding: number[]
    createdAt: Date

}

export class Knowledge extends Entity<KnowledgeProps> {
    get title() {
        return this.props.title
    }

    get content() {
        return this.props.content
    }

    get createdAt(){
        return this.props.createdAt
    }

      get embedding(){
        return this.props.embedding
    }

    static create(
        props:KnowledgeProps,
        id: UniqueEntityId
    ) {
        const knowledge = new Knowledge(
            {
                ...props,
                createdAt:props.createdAt ?? new Date()
            },
            id
        )

        return knowledge
    }

}