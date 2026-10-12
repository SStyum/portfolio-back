import { execSync } from 'node:child_process'
import { databaseUrl, E2E_TEMPLATE_DATABASE, withAdminClient } from './database'

// Roda UMA vez antes de todos os arquivos: cria o banco template com todas as migrations aplicadas
export default async function globalSetup() {
  await withAdminClient(async (client) => {
    await client.query(`DROP DATABASE IF EXISTS "${E2E_TEMPLATE_DATABASE}" WITH (FORCE)`)
    await client.query(`CREATE DATABASE "${E2E_TEMPLATE_DATABASE}"`)
  })

  // As mesmas migrations do deploy (inclui CREATE EXTENSION vector)
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: databaseUrl(E2E_TEMPLATE_DATABASE) },
    stdio: 'ignore',
  })
}
