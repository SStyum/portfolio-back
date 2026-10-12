import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

/**
 * Carrega secrets do Secrets Manager pro process.env.
 * Precisa rodar ANTES de importar o AppModule: o ConfigModule valida o env no import.
 *
 * - AWS_SECRET_ID: secret JSON da aplicação (JWT_*, GROQ_API_KEY, STRIPE_*...)
 * - DB_SECRET_ID: secret gerado pelo RDS (username, password, host...) → vira DATABASE_URL
 *
 * Sem essas variáveis (dev local) não faz nada e o .env continua valendo.
 * Variáveis já definidas no ambiente têm prioridade sobre os secrets.
 */
export async function loadSecrets(): Promise<void> {
  const appSecretId = process.env.AWS_SECRET_ID
  const dbSecretId = process.env.DB_SECRET_ID

  if (!appSecretId && !dbSecretId) {
    return
  }

  const client = new SecretsManagerClient({
    region: process.env.AWS_REGION,
    ...(process.env.AWS_ENDPOINT_URL && { endpoint: process.env.AWS_ENDPOINT_URL }),
  })

  const getJsonSecret = async <T>(secretId: string): Promise<T> => {
    const { SecretString } = await client.send(new GetSecretValueCommand({ SecretId: secretId }))

    if (!SecretString) {
      throw new Error(`Secret ${secretId} has no string value`)
    }

    return JSON.parse(SecretString) as T
  }

  if (appSecretId) {
    const secrets = await getJsonSecret<Record<string, string>>(appSecretId)

    for (const [key, value] of Object.entries(secrets)) {
      process.env[key] ??= value
    }
  }

  if (dbSecretId) {
    process.env.DATABASE_URL ??= buildDatabaseUrl(await getJsonSecret<RdsSecret>(dbSecretId))
  }
}

// Formato do secret que o RDS gera e mantém (inclusive na rotação de senha)
interface RdsSecret {
  username: string
  password: string
  host: string
  port: number
  dbname: string
}

function buildDatabaseUrl({ username, password, host, port, dbname }: RdsSecret): string {
  const user = encodeURIComponent(username)
  const pass = encodeURIComponent(password)

  // verify-full: valida o certificado da RDS (o bundle de CAs vem via NODE_EXTRA_CA_CERTS)
  return `postgresql://${user}:${pass}@${host}:${port}/${dbname}?sslmode=verify-full`
}
