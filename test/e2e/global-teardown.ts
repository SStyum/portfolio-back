import { E2E_TEMPLATE_DATABASE, withAdminClient } from './database'

export default async function globalTeardown() {
  await withAdminClient((client) =>
    client.query(`DROP DATABASE IF EXISTS "${E2E_TEMPLATE_DATABASE}" WITH (FORCE)`),
  )
}
