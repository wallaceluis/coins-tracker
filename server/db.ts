import postgres from 'postgres'
import { env } from './env.js'
import { SCHEMA } from './schema.js'

export type Sql = postgres.Sql

let client: Sql | null = null
let ready: Promise<void> | null = null

/** true quando há banco configurado (sem ele, só as cotações funcionam). */
export const hasDatabase = () => Boolean(env('DATABASE_URL'))

/**
 * Cliente único por instância serverless. `prepare: false` porque o pooler
 * do Neon/Supabase (PgBouncer em modo transação) não suporta prepared statements.
 */
export async function db(): Promise<Sql> {
  if (!client) {
    const url = env('DATABASE_URL')
    if (!url) throw new Error('DATABASE_URL is not set')
    client = postgres(url, {
      max: 1,
      idle_timeout: 20,
      prepare: false,
      ssl: /@(localhost|127\.0\.0\.1)[:/]/.test(url) ? false : 'require',
      onnotice: () => {},
    })
  }
  ready ??= client.unsafe(SCHEMA).then(() => undefined)
  await ready
  return client
}

/** Só para testes. */
export async function closeDb() {
  await client?.end({ timeout: 1 })
  client = null
  ready = null
}
