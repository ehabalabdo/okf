import { neon } from '@neondatabase/serverless';

// Neon serverless SQL - works in browser via HTTP
// Database URL must be set via environment variable (VITE_DATABASE_URL for frontend, DATABASE_URL for server)
const dbUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_DATABASE_URL)
  || (typeof process !== 'undefined' && process.env?.DATABASE_URL)
  || '';

if (!dbUrl) {
  console.error('[db] WARNING: No DATABASE_URL configured. Database operations will fail.');
}

const sql = neon(dbUrl);

export default sql;
