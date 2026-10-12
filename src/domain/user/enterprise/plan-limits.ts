import { UserPlan } from "./entities/user";

// Limites de uso por plano. Mensagens pra IA custam dinheiro (tokens).
export const PLAN_LIMITS: Record<UserPlan, { aiMessagesPerDay: number }> = {
  FREE: { aiMessagesPerDay: 20 },
  PAID: { aiMessagesPerDay: 500 },
}
