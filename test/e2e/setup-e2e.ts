import { randomUUID } from 'node:crypto'
import { DomainEvents } from '../../src/core/events/domain-events'
import { databaseUrl, E2E_TEMPLATE_DATABASE, withAdminClient } from './database'
import { loadE2EEnv } from './env'

/**
 * Roda em cada arquivo de teste E2E: um banco próprio e isolado, clonado do template.
 * Arquivos rodam em paralelo sem um ver os dados do outro.
 */
const database = `e2e_${randomUUID().replaceAll('-', '')}`

// Precisa estar no process.env antes do AppModule ser importado pelo teste
loadE2EEnv()
process.env.DATABASE_URL = databaseUrl(database)

// Subscribers registram handlers globais: cada arquivo começa limpo
DomainEvents.clearHandlers()
DomainEvents.clearMarkedAggregates()

beforeAll(async () => {
  await withAdminClient((client) =>
    client.query(`CREATE DATABASE "${database}" TEMPLATE "${E2E_TEMPLATE_DATABASE}"`),
  )
})

afterAll(async () => {
  // FORCE derruba conexões que ainda estejam abertas
  await withAdminClient((client) =>
    client.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`),
  )
})
