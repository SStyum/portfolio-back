import Stripe from 'stripe'
import { E2E_STRIPE_WEBHOOK_SECRET } from '../e2e/env'

// Evento no formato da Stripe + header de assinatura válido (gerado pelo SDK, sem rede)
export function signedStripeEvent(event: { type: string; data: { object: object }; created?: number; id?: string }) {
  const payload = JSON.stringify({
    id: event.id ?? `evt_${Math.random().toString(36).slice(2)}`,
    object: 'event',
    created: event.created ?? Math.floor(Date.now() / 1000),
    ...event,
  })

  const signature = new Stripe('sk_test_e2e').webhooks.generateTestHeaderString({
    payload,
    secret: E2E_STRIPE_WEBHOOK_SECRET,
  })

  return { payload, signature }
}
