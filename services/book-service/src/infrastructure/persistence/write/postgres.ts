import { Pool, PoolClient } from 'pg';
import { config } from '../../config/index.js';

/**
 * PostgreSQL connection pool singleton
 */
let pool: Pool | null = null;

/**
 * Get or create the PostgreSQL connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: config.postgres.host,
      port: config.postgres.port,
      user: config.postgres.user,
      password: config.postgres.password,
      database: config.postgres.database,
      ssl: config.postgres.ssl ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Log connection events
    pool.on('connect', () => {
      console.log('📦 PostgreSQL: New client connected');
    });

    pool.on('error', (err) => {
      console.error('❌ PostgreSQL pool error:', err);
    });
  }

  return pool;
}

/**
 * Close the connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('📦 PostgreSQL: Pool closed');
  }
}

/**
 * Execute a query with automatic connection handling
 */
export async function query<T>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  const pool = getPool();
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (config.nodeEnv === 'development') {
      console.log('📦 Query executed:', { text: text.substring(0, 100), duration: `${duration}ms`, rows: result.rowCount });
    }
    
    return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
  } catch (error) {
    console.error('❌ Query error:', { text: text.substring(0, 100), error });
    throw error;
  }
}

/**
 * Execute multiple queries in a transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Health check for PostgreSQL connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query<{ now: Date }>('SELECT NOW()');
    return result.rows.length > 0;
  } catch {
    return false;
  }
}

/**
 * Initializes the database schema if it doesn't exist.
 * This makes the service "ready to go" on any new environment.
 */
export async function initializeDatabase(): Promise<void> {
  const schema = `
    CREATE TABLE IF NOT EXISTS books (
        id UUID PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author_id UUID NOT NULL,
        page_count INTEGER NOT NULL,
        isbn VARCHAR(20) UNIQUE,
        year_read INTEGER,
        status VARCHAR(50) NOT NULL,
        rating INTEGER,
        cover_url TEXT,
        version INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS quotes (
        id UUID PRIMARY KEY,
        book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        page INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notes (
        id UUID PRIMARY KEY,
        book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        chapter VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  try {
    console.log('🐘 PostgreSQL: Ensuring schema exists...');
    await query(schema);
    console.log('🐘 PostgreSQL: Schema is ready.');
  } catch (error) {
    console.error('🐘 PostgreSQL: Error during schema initialization:', error);
    throw error;
  }
}
