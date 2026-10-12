import { Entity } from "../../../../core/entities/entity";
import { UniqueEntityId } from "../../../../core/entities/unique-entity-id";

// Para adicionar Google etc.: inclua aqui e no enum OAuthProvider do Prisma
export type OAuthProviderName = "GITHUB"

interface OAuthAccountProps {
  provider: OAuthProviderName
  providerAccountId: string
  userId: UniqueEntityId
  createdAt: Date
}

export class OAuthAccount extends Entity<OAuthAccountProps> {
  get provider() {
    return this.props.provider
  }

  get providerAccountId() {
    return this.props.providerAccountId
  }

  get userId() {
    return this.props.userId
  }

  get createdAt() {
    return this.props.createdAt
  }

  static create(props: Omit<OAuthAccountProps, 'createdAt'> & { createdAt?: Date }, id?: UniqueEntityId) {
    return new OAuthAccount({
      ...props,
      createdAt: props.createdAt ?? new Date(),
    }, id)
  }
}
