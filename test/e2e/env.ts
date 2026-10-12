import { generateKeyPairSync } from 'node:crypto'

/**
 * Ambiente dos testes E2E. Tudo explícito: nada vem do .env da máquina
 * (o ConfigModule ignora o .env quando NODE_ENV=test).
 * Serviços externos (IA, broker, e-mail, storage) são trocados por fakes em create-e2e-app.ts.
 */
export function loadE2EEnv() {
  // Par RSA só pra esta execução (o JWT da app é RS256)
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })

  Object.assign(process.env, {
    NODE_ENV: 'test',
    RATE_LIMIT_DISABLED: 'true',
    GROQ_API_KEY: 'e2e',
    JWT_PRIVATE_KEY: Buffer.from(privateKey).toString('base64'),
    JWT_PUBLIC_KEY: Buffer.from(publicKey).toString('base64'),
    PAYMENT_PROVIDER: 'STRIPE',
    STRIPE_SECRET_KEY: 'sk_test_e2e',
    STRIPE_WEBHOOK_SECRET: E2E_STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_ID_PAID: 'price_e2e',
    FRONTEND_URL: 'http://front.e2e',
    STORAGE_PROVIDER: 'S3',
    S3_BUCKET: 'e2e',
    MESSAGING_PROVIDER: 'RABBITMQ',
    RABBITMQ_URL: 'amqp://e2e:e2e@localhost:5672',
    EMAIL_PROVIDER: 'LOG',
  })
}

export const E2E_STRIPE_WEBHOOK_SECRET = 'whsec_e2e'
