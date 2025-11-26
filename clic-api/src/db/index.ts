import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// ============================================================================
// NEON DATABASE CONNECTION
// ============================================================================

const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return url;
};

// Conexión serverless (para Vercel/Edge)
const sql = neon(getDatabaseUrl());

// Cliente Drizzle con schema
export const db = drizzle(sql, { schema });

// Re-export schema
export { schema };

// ============================================================================
// HELPERS
// ============================================================================

export type DB = typeof db;
