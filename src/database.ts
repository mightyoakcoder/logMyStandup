import pg from 'pg';
const { Pool } = pg;

// Production-ready pool config for Cloud Run + Cloud SQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  ssl: {
    rejectUnauthorized: false  // Required for Cloud SQL
  },
  max: 10,                    // Max connections
  idleTimeoutMillis: 30000,   // Close idle after 30s
  connectionTimeoutMillis: 5000,
});

// Graceful shutdown
pool.on('error', (err: any) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export async function query<T extends Record<string, any> = any>(text: string, params?: any[]): 
Promise<{ rows: T[] }> {
  const client = await pool.connect()
  try {
    const res = await client.query<T>(text, params)
    return { rows: res.rows }
  } finally {
    client.release()
  }
}
