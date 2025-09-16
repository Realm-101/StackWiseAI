import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure the pool for regular PostgreSQL connection
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: false // SSL is already disabled in the connection string
});

export { pool };
export const db = drizzle({ client: pool, schema });