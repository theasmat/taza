import pg from "pg";
import { config } from "./config";

const pool = new pg.Pool({
  connectionString:
    config.DATABASE_URL || "postgresql://test:Test%40123@localhost:5432/test",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export { pool as pg };

export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log("Payment service database connection established");
    await client.query("SELECT NOW()");
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  } finally {
    client.release();
  }
}
