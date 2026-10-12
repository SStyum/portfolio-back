import { Payment } from "../../../domain/payment/enterprise/entities/payment";

export class PaymentPresenter{
  static toHTTP(payment: Payment){
    return {
      id: payment.id.toString(),
      provider: payment.provider,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      createdAt: payment.createdAt
    }
  }
}
