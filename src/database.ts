import pg from 'pg';
const { Pool } = pg;

// Pool is created lazily on first query so that secrets loaded at startup
// (from Secret Manager or .env) are available before the connection is made.
let pool: InstanceType<typeof Pool> | null = null

function getPool(): InstanceType<typeof Pool> {
  if (!pool) {
    const host = process.env.DB_HOST ?? ''
    const isSocket = host.startsWith('/')
    pool = new Pool({
      host,
      port: isSocket ? undefined : (Number(process.env.DB_PORT) || 5432),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: isSocket ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })

    pool.on('error', (err: any) => {
      console.error('Unexpected error on idle client', err)
      process.exit(-1)
    })
  }
  return pool
}

export async function query<T extends Record<string, any> = any>(text: string, params?: any[]):
Promise<{ rows: T[] }> {
  const client = await getPool().connect()
  try {
    const res = await client.query<T>(text, params)
    return { rows: res.rows }
  } finally {
    client.release()
  }
}
