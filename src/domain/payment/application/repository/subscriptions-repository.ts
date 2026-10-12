import { Subscription } from "../../enterprise/entities/subscription";

export abstract class SubscriptionsRepository {
  abstract findByUserId(userId: string): Promise<Subscription | null>
  // Cria ou atualiza (um usuário tem no máximo uma assinatura)
  abstract save(subscription: Subscription): Promise<void>
}
