import { Subscription } from "../../../domain/payment/enterprise/entities/subscription";

export class SubscriptionPresenter {
  static toHTTP(subscription: Subscription) {
    return {
      provider: subscription.provider,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    }
  }
}
