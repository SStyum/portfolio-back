import { PaymentProviderName, PaymentStatus } from "../../enterprise/entities/payment";

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

export abstract class PaymentGateway {
  abstract readonly name: PaymentProviderName
  abstract createPayment(input: CreatePaymentInput): Promise<CreatePaymentOutput>
  abstract cancelPayment(externalId: string): Promise<void>
}
