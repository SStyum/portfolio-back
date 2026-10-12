import { Client } from 'pg'

// Postgres onde os bancos de teste são criados (docker-compose local ou service do CI)
export const E2E_BASE_URL = process.env.E2E_DATABASE_URL ?? 'postgresql://docker:docker@localhost:5450/portfolio'

// Banco já migrado, clonado por cada arquivo de teste (CREATE DATABASE ... TEMPLATE é bem mais rápido que migrar)
export const E2E_TEMPLATE_DATABASE = 'portfolio_e2e_template'

export function databaseUrl(database: string) {
  const url = new URL(E2E_BASE_URL)
  url.pathname = `/${database}`
  url.search = ''
  return url.toString()
}

// Conexão administrativa no banco base (CREATE/DROP DATABASE não rodam dentro do banco alvo)
export async function withAdminClient<T>(fn: (client: Client) => Promise<T>) {
  const client = new Client({ connectionString: E2E_BASE_URL })
  await client.connect()

  try {
    return await fn(client)
  } finally {
    await client.end()
  }
}
