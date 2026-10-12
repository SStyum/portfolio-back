import { PaymentProviderName, PaymentStatus } from "../../enterprise/entities/payment";
import { SubscriptionStatus } from "../../enterprise/entities/subscription";

export interface CreatePaymentInput {
  userId: string
  amount: number        // em centavos
  currency: string      // 'brl', 'usd'
  customerId?: string
  metadata?: Record<string, string>
}

// O que o frontend precisa pra concluir o pagamento. O `type` diz como o front deve agir.
export type PaymentClientPayload =
  // SDK no front confirma o pagamento (ex.: Stripe Elements)
  | { type: "client_secret"; clientSecret: string }
  // Checkout hospedado pela API — o front só redireciona
  | { type: "redirect"; url: string }
  // PIX — o front exibe o QR code / copia e cola
  | { type: "pix"; qrCode: string; qrCodeBase64?: string; expiresAt?: Date }

export interface CreatePaymentOutput {
  // ID do pagamento na API externa (PaymentIntent da Stripe, preference do MercadoPago, etc.)
  externalId: string
  externalCustomerId?: string
  // Já convertido pro status do domínio — cada gateway faz seu próprio mapeamento
  status: PaymentStatus
  clientPayload: PaymentClientPayload
}

export interface CreateCustomerInput {
  userId: string
  name: string
  email: string
}

export interface CreateCheckoutSessionInput {
  userId: string
  customerId: string
  successUrl: string
  cancelUrl: string
}

export interface CreateBillingPortalSessionInput {
  customerId: string
  returnUrl: string
}

// Eventos de cobrança já normalizados: o domínio não conhece o formato de nenhuma API
export type BillingEvent =
  | {
    type: "subscription.updated"
    eventId: string
    occurredAt: Date
    externalCustomerId: string
    externalSubscriptionId: string
    status: SubscriptionStatus
    currentPeriodEnd?: Date
    cancelAtPeriodEnd: boolean
  }
  | {
    type: "invoice.paid"
    eventId: string
    occurredAt: Date
    externalCustomerId: string
    externalInvoiceId: string
    amount: number
    currency: string
  }

export class InvalidWebhookSignatureError extends Error {
  constructor() {
    super("Invalid webhook signature")
  }
}

export abstract class PaymentGateway {
  abstract readonly name: PaymentProviderName

  // Pagamento avulso
  abstract createPayment(input: CreatePaymentInput): Promise<CreatePaymentOutput>
  abstract cancelPayment(externalId: string): Promise<void>

  // Assinatura
  abstract createCustomer(input: CreateCustomerInput): Promise<{ customerId: string }>
  abstract createCheckoutSession(input: CreateCheckoutSessionInput): Promise<{ url: string }>
  abstract createBillingPortalSession(input: CreateBillingPortalSessionInput): Promise<{ url: string }>

  /**
   * Valida a assinatura do webhook e traduz o evento.
   * Retorna null pra eventos que não interessam. Lança InvalidWebhookSignatureError se a assinatura for inválida.
   */
  abstract parseWebhookEvent(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): Promise<BillingEvent | null>
}
