import { PaymentStatus } from "@prisma/client";

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

export interface CreatePaymentInput {
  userId: string
  amount: number        // em centavos
  currency: string      // 'brl', 'usd'
  customerId?: string
  metadata?: Record<string, string>;
}

export interface CreatePaymentOutput {
  paymentIntentId: string;
  clientSecret: string;
  status: PaymentStatus;
  customerId?: string;
}

export interface PaymentProvider {
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentOutput>;
  cancelPayment(paymentIntentId: string): Promise<void>;
  // quando quiser adicionar: refundPayment, getPayment, etc.
}