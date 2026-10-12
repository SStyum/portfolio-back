import { PaymentProviderName, PaymentStatus } from "../../enterprise/entities/payment";

export interface CreatePaymentInput {
  userId: string
  amount: number        // em centavos
  currency: string      // 'brl', 'usd'
  customerId?: string
  metadata?: Record<string, string>
}

export interface CreatePaymentOutput {
  // ID do pagamento na API externa (PaymentIntent da Stripe, preference do MercadoPago, etc.)
  externalId: string
  externalCustomerId?: string
  // Já convertido pro status do domínio — cada gateway faz seu próprio mapeamento
  status: PaymentStatus
  // Opaco pro domínio — o que o frontend precisa pra concluir o pagamento (clientSecret, checkoutUrl, qrCode...)
  clientPayload: Record<string, unknown>
}

export abstract class PaymentGateway {
  abstract readonly name: PaymentProviderName
  abstract createPayment(input: CreatePaymentInput): Promise<CreatePaymentOutput>
  abstract cancelPayment(externalId: string): Promise<void>
}
